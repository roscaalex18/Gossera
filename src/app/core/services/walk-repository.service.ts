import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Walk } from '../models/walk.model';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { ToastService } from '../../shared/toast/toast.service';
import { ActivityLogService } from './activity-log.service';
import { AuthService } from './auth.service';
import { DogRepositoryService } from './dog-repository.service';

const CACHE_KEY = 'gossera.walks.cache.v1';
const RECENT_LIMIT = 200;

interface WalkRow {
  id: string;
  dog_id: string;
  fecha: string;
  paseado_por: string | null;
  paseado_por_email: string | null;
  notas: string | null;
}

/**
 * Reactive repository of walks (paseos) backed by Supabase.
 * Local cache for offline / instant startup + Realtime for cross-device sync.
 */
@Injectable({ providedIn: 'root' })
export class WalkRepositoryService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly activityLog = inject(ActivityLogService);
  private readonly dogRepository = inject(DogRepositoryService);
  private readonly toast = inject(ToastService);

  readonly walks = signal<Walk[]>(loadCache());

  /** Newest first, capped at RECENT_LIMIT. */
  readonly recent = computed(() =>
    this.walks()
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, RECENT_LIMIT)
  );

  private channel: RealtimeChannel | null = null;

  constructor() {
    void this.refresh();
    this.subscribeToRealtime();

    effect(() => {
      const snapshot = this.walks();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore quota errors.
      }
    });
  }

  async refresh(): Promise<void> {
    const { data, error } = await this.supabase
      .from('walks')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(RECENT_LIMIT);

    if (error) return;
    this.walks.set(((data ?? []) as WalkRow[]).map(rowToWalk));
  }

  /** Return the walks for a given dog, newest first. */
  forDog(dogId: string): Walk[] {
    return this.walks()
      .filter((w) => w.dogId === dogId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  /**
   * Log a new walk for `dogId`. Optimistically inserts into local state and
   * pushes to Supabase.
   *
   * The caller (or a computed side effect) is responsible for updating
   * `dogs.ultimo_paseo` / `necesita_paseo_hoy` — that lives in
   * `DogRepositoryService.markWalked`.
   */
  async logWalk(dogId: string, notas?: string): Promise<{ ok: true; walk: Walk } | { ok: false; message: string }> {
    const userId = this.auth.user()?.id ?? null;
    const userEmail = this.auth.user()?.email;
    const now = new Date().toISOString();

    // Optimistic entry (server will replace the id when refresh runs).
    const optimistic: Walk = {
      id: crypto.randomUUID(),
      dogId,
      fecha: now,
      paseadoPor: userEmail,
      notas: notas?.trim() || undefined
    };
    this.walks.update((list) => [optimistic, ...list]);

    const { data, error } = await this.supabase
      .from('walks')
      .insert({
        dog_id: dogId,
        fecha: now,
        paseado_por: userId,
        paseado_por_email: userEmail ?? null,
        notas: notas?.trim() || null
      })
      .select('*')
      .single();

    if (error || !data) {
      // Rollback.
      this.walks.update((list) => list.filter((w) => w.id !== optimistic.id));
      return { ok: false, message: error?.message ?? 'No se pudo registrar el paseo.' };
    }

    // Replace optimistic entry with the server one.
    const saved = rowToWalk(data as WalkRow);
    this.walks.update((list) => [saved, ...list.filter((w) => w.id !== optimistic.id)]);

    const dog = this.dogRepository.dogs().find((d) => d.id === dogId);

    // Efecto colateral: si el perro estaba destacado (prioridad máxima),
    // el paseo resuelve la urgencia → quitamos la huella automáticamente.
    // Silencioso (sin activity log propio) porque `walk.log` ya cuenta la
    // acción; el user no necesita ver "quitó prioridad" además.
    if (dog?.destacado) {
      await this.dogRepository.setDestacado(dogId, false);
    }

    this.activityLog.log({
      action: 'walk.log',
      entityType: 'walk',
      entityId: saved.id,
      summary: dog?.nombre ? `Paseó a ${dog.nombre}` : `Registró paseo de ${dogId}`,
      metadata: { dogId, notas: notas?.trim() || undefined }
    });
    this.toast.success(dog?.nombre ? `Paseo de ${dog.nombre} registrado` : 'Paseo registrado');

    return { ok: true, walk: saved };
  }

  /**
   * Borra un paseo mal registrado. Optimista con rollback si falla.
   * Tras borrar, recalcula `dogs.ultimo_paseo` como `max(fecha)` de los
   * paseos que le queden al perro (así el indicador de "necesita paseo"
   * queda coherente).
   */
  async deleteWalk(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const previous = this.walks();
    const target = previous.find((w) => w.id === id);

    // Optimistic remove.
    this.walks.update((list) => list.filter((w) => w.id !== id));

    const { error } = await this.supabase.from('walks').delete().eq('id', id);
    if (error) {
      // Rollback.
      this.walks.set(previous);
      return { ok: false, message: error.message };
    }

    if (target) {
      await this.recalculateDogLastWalk(target.dogId);

      const dogName = this.dogRepository.dogs().find((d) => d.id === target.dogId)?.nombre;
      this.activityLog.log({
        action: 'walk.delete',
        entityType: 'walk',
        entityId: id,
        summary: dogName
          ? `Eliminó paseo de ${dogName}`
          : `Eliminó paseo del perro ${target.dogId}`,
        metadata: {
          dogId: target.dogId,
          fecha: target.fecha,
          paseadoPor: target.paseadoPor
        }
      });
      this.toast.success(dogName ? `Paseo de ${dogName} eliminado` : 'Paseo eliminado');
    }

    return { ok: true };
  }

  /**
   * Edita un paseo existente. Se puede cambiar la fecha (para marcarlo en
   * el pasado si se olvidó registrar en su momento), las notas y la persona
   * que lo paseó (para atribuirlo a otro voluntario a posteriori). Si la
   * fecha cambia, recalcula `dogs.ultimo_paseo` para el perro.
   *
   * `paseadoPor` acepta:
   *   - `undefined` → no toca ese campo.
   *   - `null`      → borra el atributo (paseo sin autor).
   *   - `string`    → email/usuario. Al cambiarlo, la columna `paseado_por`
   *                   (FK UUID a auth.users) se pone a null porque desde el
   *                   cliente no podemos resolver ese texto a un UUID real;
   *                   la fuente de verdad para la UI pasa a ser
   *                   `paseado_por_email`.
   */
  async updateWalk(
    id: string,
    patch: { fecha?: string; notas?: string | null; paseadoPor?: string | null }
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const previous = this.walks();
    const current = previous.find((w) => w.id === id);
    if (!current) return { ok: false, message: 'El paseo ya no existe.' };

    const next: Walk = {
      ...current,
      fecha: patch.fecha ?? current.fecha,
      notas:
        patch.notas === undefined
          ? current.notas
          : patch.notas ?? undefined,
      paseadoPor:
        patch.paseadoPor === undefined
          ? current.paseadoPor
          : patch.paseadoPor ?? undefined
    };

    // Optimistic update.
    this.walks.update((list) => list.map((w) => (w.id === id ? next : w)));

    const row: Partial<WalkRow> = {};
    if (patch.fecha !== undefined) row.fecha = patch.fecha;
    if (patch.notas !== undefined) row.notas = patch.notas;
    if (patch.paseadoPor !== undefined) {
      row.paseado_por_email = patch.paseadoPor;
      // El FK a auth.users deja de ser fiable si sobrescribimos el email.
      row.paseado_por = null;
    }

    const { error } = await this.supabase.from('walks').update(row).eq('id', id);
    if (error) {
      // Rollback.
      this.walks.set(previous);
      return { ok: false, message: error.message };
    }

    // Recalcular ultimo_paseo del perro si cambió la fecha.
    if (patch.fecha !== undefined && patch.fecha !== current.fecha) {
      await this.recalculateDogLastWalk(current.dogId);
    }

    const dogName = this.dogRepository.dogs().find((d) => d.id === current.dogId)?.nombre;
    this.activityLog.log({
      action: 'walk.update',
      entityType: 'walk',
      entityId: id,
      summary: dogName ? `Editó paseo de ${dogName}` : `Editó paseo ${id}`,
      metadata: {
        dogId: current.dogId,
        oldFecha: current.fecha,
        newFecha: next.fecha,
        notasChanged: patch.notas !== undefined,
        paseadoPorChanged: patch.paseadoPor !== undefined
      }
    });
    this.toast.success(dogName ? `Paseo de ${dogName} actualizado` : 'Paseo actualizado');

    return { ok: true };
  }

  /**
   * Recalcula `dogs.ultimo_paseo` para un perro como el `max(fecha)` de los
   * paseos que le quedan en el estado local. Se llama tras editar o borrar
   * un paseo para que el indicador de "necesita paseo" sea consistente.
   * Silencioso: sin log de actividad (es efecto colateral, no acción del
   * usuario).
   */
  private async recalculateDogLastWalk(dogId: string): Promise<void> {
    const dogWalks = this.walks().filter((w) => w.dogId === dogId);
    if (dogWalks.length === 0) return; // Sin paseos, dejamos ultimo_paseo como está.

    const maxFecha = dogWalks.reduce(
      (max, w) => (w.fecha > max ? w.fecha : max),
      dogWalks[0].fecha
    );
    await this.dogRepository.markWalked(dogId, new Date(maxFecha));
  }

  private subscribeToRealtime(): void {
    this.channel = this.supabase
      .channel('gossera-walks')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'walks' },
        () => void this.refresh()
      )
      .subscribe();
  }
}

function rowToWalk(row: WalkRow): Walk {
  return {
    id: row.id,
    dogId: row.dog_id,
    fecha: row.fecha,
    // Prefer the denormalised email; fall back to the raw UUID only if the
    // email is missing (e.g. very old rows before migration 006).
    paseadoPor: row.paseado_por_email ?? row.paseado_por ?? undefined,
    notas: row.notas ?? undefined
  };
}

function loadCache(): Walk[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Walk[]) : [];
  } catch {
    return [];
  }
}
