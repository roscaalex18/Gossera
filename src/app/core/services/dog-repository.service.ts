import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Dog, DogEstado } from '../models/dog.model';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { DogRow, dogToRow, rowToDog } from '../supabase/supabase.mappers';

const CACHE_KEY = 'gossera.dogs.cache.v1';
const PHOTOS_BUCKET = 'dog-photos';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Shape used by `createDog`. The internal `id` (PK) is always auto-generated. */
export interface CreateDogInput {
  nombre: string;
  raza: string;
  /** External code (e.g. from the town hall record). Optional. */
  codigo?: string;
  edad?: number;
  energia?: Dog['energia'];
  prioridadPaseo?: Dog['prioridadPaseo'];
  sexo?: Dog['sexo'];
  color?: string;
  notas?: string;
  fotos?: string[];
  esPPP?: boolean;
  bozalObligatorio?: boolean;
  cuidadoMachos?: boolean;
  cuidadoHembras?: boolean;
}

/** Fields the UI can patch on an existing dog. */
export type UpdateDogPatch = Partial<
  Pick<
    Dog,
    | 'nombre'
    | 'edad'
    | 'raza'
    | 'codigo'
    | 'energia'
    | 'prioridadPaseo'
    | 'sexo'
    | 'color'
    | 'notas'
    | 'estado'
    | 'adoptadoEn'
    | 'esPPP'
    | 'bozalObligatorio'
    | 'cuidadoMachos'
    | 'cuidadoHembras'
  >
>;

/**
 * Reactive repository of dogs backed by Supabase, with a local cache for
 * instant startup and offline PWA support.
 *
 *  - `dogs()`: current list (updated live via Supabase Realtime).
 *  - `status()` / `error()`: load state for UI feedback.
 *  - Mutations do optimistic updates + push to Supabase.
 *  - Photo methods talk to Supabase Storage bucket `dog-photos`.
 */
@Injectable({ providedIn: 'root' })
export class DogRepositoryService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  readonly dogs = signal<Dog[]>(loadCache());
  readonly status = signal<LoadStatus>('idle');
  readonly error = signal<string | null>(null);

  readonly hasCache = computed(() => this.dogs().length > 0);

  private channel: RealtimeChannel | null = null;

  constructor() {
    void this.refresh();
    this.subscribeToRealtime();

    // Persist to cache on every change (feeds the next cold start / offline).
    effect(() => {
      const snapshot = this.dogs();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore quota / private mode errors.
      }
    });
  }

  /** Force reload from Supabase. */
  async refresh(): Promise<void> {
    this.status.set('loading');
    const { data, error } = await this.supabase
      .from('dogs')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.error.set(error.message);
      this.status.set('error');
      return;
    }

    this.dogs.set(((data ?? []) as DogRow[]).map(rowToDog));
    this.status.set('ready');
    this.error.set(null);
  }

  /** True if a dog with `id` already exists in local state. */
  hasDog(id: string): boolean {
    return this.dogs().some((d) => d.id === id);
  }

  /**
   * Generate a unique auto-id in `R-XXXXXX` format (6 hex chars) for the
   * internal primary key. Never shown to the user; retries against the
   * local cache until an unused id is produced.
   */
  private generateDogId(): string {
    let id: string;
    do {
      const random = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
      id = `R-${random}`;
    } while (this.hasDog(id));
    return id;
  }

  /**
   * Create a new dog. The technical `id` is always auto-generated.
   * `codigo` (external reference) is optional; if provided it must be unique
   * at the DB level (see migration 007).
   */
  async createDog(input: CreateDogInput): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
    const id = this.generateDogId();
    const codigo = input.codigo?.trim() || undefined;

    const dog: Dog = {
      id,
      codigo,
      nombre: input.nombre.trim(),
      raza: input.raza.trim(),
      edad: input.edad ?? 0,
      energia: input.energia ?? 'media',
      prioridadPaseo: input.prioridadPaseo ?? 'media',
      ultimoPaseo: new Date().toISOString(),
      necesitaPaseoHoy: true,
      fotos: input.fotos ?? [],
      estado: 'activo',
      notas: input.notas?.trim() || undefined,
      sexo: input.sexo,
      color: input.color?.trim() || undefined,
      esPPP: input.esPPP ?? false,
      bozalObligatorio: input.bozalObligatorio ?? false,
      cuidadoMachos: input.cuidadoMachos ?? false,
      cuidadoHembras: input.cuidadoHembras ?? false
    };

    // Optimistic add.
    this.dogs.update((list) => [...list, dog]);

    const { error } = await this.supabase.from('dogs').insert(dogToRow(dog));
    if (error) {
      // Rollback.
      this.dogs.update((list) => list.filter((d) => d.id !== dog.id));
      return { ok: false, message: error.message };
    }
    return { ok: true, id };
  }

  /** Insert-or-update a dog. */
  async upsertDog(dog: Dog): Promise<void> {
    this.dogs.update((list) => {
      const idx = list.findIndex((d) => d.id === dog.id);
      return idx === -1
        ? [...list, dog]
        : list.map((d) => (d.id === dog.id ? dog : d));
    });

    const { error } = await this.supabase.from('dogs').upsert(dogToRow(dog));
    if (error) {
      this.error.set(error.message);
      // Reconcile on failure so the UI matches the server.
      void this.refresh();
    }
  }

  /**
   * Patch an existing dog. Only the provided fields are sent.
   * Handles the `estado === 'adoptado'` side effect (sets `adoptadoEn`).
   */
  async updateDog(id: string, patch: UpdateDogPatch): Promise<{ ok: true } | { ok: false; message: string }> {
    const current = this.dogs().find((d) => d.id === id);
    if (!current) return { ok: false, message: 'El perro ya no existe.' };

    // Auto-manage adoption timestamp.
    const applied: UpdateDogPatch = { ...patch };
    if (patch.estado && patch.estado !== current.estado) {
      applied.adoptadoEn =
        patch.estado === 'adoptado' ? new Date().toISOString() : undefined;
    }

    const next: Dog = { ...current, ...applied } as Dog;
    const previous = this.dogs();
    this.dogs.update((list) => list.map((d) => (d.id === id ? next : d)));

    const row: Partial<DogRow> = {};
    if (applied.nombre !== undefined) row.nombre = applied.nombre;
    if (applied.codigo !== undefined) row.codigo = applied.codigo ?? null;
    if (applied.edad !== undefined) row.edad = applied.edad;
    if (applied.raza !== undefined) row.raza = applied.raza;
    if (applied.energia !== undefined) row.energia = applied.energia;
    if (applied.prioridadPaseo !== undefined) row.prioridad_paseo = applied.prioridadPaseo;
    if (applied.sexo !== undefined) row.sexo = applied.sexo ?? null;
    if (applied.color !== undefined) row.color = applied.color ?? null;
    if (applied.notas !== undefined) row.notas = applied.notas ?? null;
    if (applied.estado !== undefined) row.estado = applied.estado;
    if (applied.adoptadoEn !== undefined) row.adoptado_en = applied.adoptadoEn ?? null;
    if (applied.esPPP !== undefined) row.es_ppp = applied.esPPP;
    if (applied.bozalObligatorio !== undefined) row.bozal_obligatorio = applied.bozalObligatorio;
    if (applied.cuidadoMachos !== undefined) row.cuidado_machos = applied.cuidadoMachos;
    if (applied.cuidadoHembras !== undefined) row.cuidado_hembras = applied.cuidadoHembras;

    const { error } = await this.supabase.from('dogs').update(row).eq('id', id);
    if (error) {
      this.dogs.set(previous);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  /** Delete a dog by id. */
  async deleteDog(id: string): Promise<void> {
    const previous = this.dogs();
    this.dogs.update((list) => list.filter((d) => d.id !== id));

    const { error } = await this.supabase.from('dogs').delete().eq('id', id);
    if (error) {
      this.error.set(error.message);
      this.dogs.set(previous);
    }
  }

  /** Mark a dog as walked (updates `ultimoPaseo` and clears the pending flag). */
  async markWalked(id: string, when: Date = new Date()): Promise<void> {
    const iso = when.toISOString();
    this.dogs.update((list) =>
      list.map((d) =>
        d.id === id
          ? { ...d, ultimoPaseo: iso, necesitaPaseoHoy: false }
          : d
      )
    );

    const { error } = await this.supabase
      .from('dogs')
      .update({ ultimo_paseo: iso, necesita_paseo_hoy: false })
      .eq('id', id);

    if (error) {
      this.error.set(error.message);
      void this.refresh();
    }
  }

  // ==========================================================================
  // Photos (Supabase Storage — bucket `dog-photos`)
  // ==========================================================================

  /**
   * Upload a photo file to the bucket and append its public URL to the dog's
   * `fotos` array. Returns the resulting public URL.
   */
  async addPhoto(dogId: string, file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
    const ext = extensionFromFile(file);
    const path = `${dogId}/${crypto.randomUUID()}.${ext}`;

    const upload = await this.supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      });

    if (upload.error) {
      return { ok: false, message: upload.error.message };
    }

    const { data: pub } = this.supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(path);
    const url = pub.publicUrl;

    // Optimistic array update.
    const previous = this.dogs();
    this.dogs.update((list) =>
      list.map((d) => (d.id === dogId ? { ...d, fotos: [...d.fotos, url] } : d))
    );

    const dog = this.dogs().find((d) => d.id === dogId);
    if (!dog) {
      // Dog was removed between operations; try to clean up the orphan file.
      void this.supabase.storage.from(PHOTOS_BUCKET).remove([path]);
      return { ok: false, message: 'El perro ya no existe.' };
    }

    const { error } = await this.supabase
      .from('dogs')
      .update({ fotos: dog.fotos })
      .eq('id', dogId);

    if (error) {
      // Rollback both the array and the uploaded file.
      this.dogs.set(previous);
      void this.supabase.storage.from(PHOTOS_BUCKET).remove([path]);
      return { ok: false, message: error.message };
    }

    return { ok: true, url };
  }

  /** Remove a photo URL from the dog's array and delete it from Storage. */
  async removePhoto(dogId: string, url: string): Promise<void> {
    const previous = this.dogs();
    this.dogs.update((list) =>
      list.map((d) =>
        d.id === dogId ? { ...d, fotos: d.fotos.filter((u) => u !== url) } : d
      )
    );

    const dog = this.dogs().find((d) => d.id === dogId);
    if (!dog) return;

    const { error } = await this.supabase
      .from('dogs')
      .update({ fotos: dog.fotos })
      .eq('id', dogId);

    if (error) {
      this.error.set(error.message);
      this.dogs.set(previous);
      return;
    }

    // Best-effort cleanup of the underlying file (ignore errors).
    const path = pathFromPublicUrl(url);
    if (path) {
      void this.supabase.storage.from(PHOTOS_BUCKET).remove([path]);
    }
  }

  /** Move a photo URL to position 0 (make it the primary/card cover). */
  async setPrimaryPhoto(dogId: string, url: string): Promise<void> {
    const previous = this.dogs();
    this.dogs.update((list) =>
      list.map((d) => {
        if (d.id !== dogId || !d.fotos.includes(url)) return d;
        const others = d.fotos.filter((u) => u !== url);
        return { ...d, fotos: [url, ...others] };
      })
    );

    const dog = this.dogs().find((d) => d.id === dogId);
    if (!dog) return;

    const { error } = await this.supabase
      .from('dogs')
      .update({ fotos: dog.fotos })
      .eq('id', dogId);

    if (error) {
      this.error.set(error.message);
      this.dogs.set(previous);
    }
  }

  private subscribeToRealtime(): void {
    this.channel = this.supabase
      .channel('gossera-dogs')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'dogs' },
        () => void this.refresh()
      )
      .subscribe();
  }
}

// ============================================================================
// Helpers
// ============================================================================

function loadCache(): Dog[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Normalize old cache shape (`fotoUrl`, missing `estado` / safety flags) → new shape.
    return (parsed as Dog[]).map((d) => ({
      ...d,
      estado: d.estado ?? 'activo',
      fotos: Array.isArray(d.fotos)
        ? d.fotos
        : (d as unknown as { fotoUrl?: string }).fotoUrl
          ? [(d as unknown as { fotoUrl: string }).fotoUrl]
          : [],
      esPPP: d.esPPP ?? false,
      bozalObligatorio: d.bozalObligatorio ?? false,
      cuidadoMachos: d.cuidadoMachos ?? false,
      cuidadoHembras: d.cuidadoHembras ?? false
    }));
  } catch {
    return [];
  }
}

function extensionFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const fromMime = file.type.split('/')[1];
  return fromMime || 'jpg';
}

/** Extract the object path from a Supabase Storage public URL. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${PHOTOS_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
