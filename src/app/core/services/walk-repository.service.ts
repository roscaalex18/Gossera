import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Walk } from '../models/walk.model';
import { AuthService } from './auth.service';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';

const CACHE_KEY = 'gossera.walks.cache.v1';
const RECENT_LIMIT = 200;

interface WalkRow {
  id: string;
  dog_id: string;
  fecha: string;
  paseado_por: string | null;
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

    return { ok: true, walk: saved };
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
    paseadoPor: row.paseado_por ?? undefined,
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
