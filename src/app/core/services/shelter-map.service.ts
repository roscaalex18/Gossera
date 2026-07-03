import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ShelterAssignments, ShelterRegion } from '../models/shelter-map.model';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';

const CACHE_KEY = 'gossera.shelter-map.assignments.cache.v1';

const rowStartPPP = 20;
const colStartPPP = 16;
const rowStart = 1;
const rowEnd = 74;
const colEnd = 99;

/**
 * Default shelter layout. Coordinates are 1-based inclusive.
 * The map viewBox is `MAP_VIEWBOX_COLS` × `MAP_VIEWBOX_ROWS`.
 * This layout is static in the client (not persisted).
 */
export const MAP_VIEWBOX_COLS = 100;
export const MAP_VIEWBOX_ROWS = 75;

const DEFAULT_REGIONS: ShelterRegion[] = [
  // === Bloque Cuarentena (esquina superior derecha) ===
  { id: 'c1', name: 'C1', type: 'quarantena', rowStart: rowStart, rowEnd: rowStart + 3, colStart: colEnd - 18, colEnd: colEnd - 15 },
  { id: 'c2', name: 'C2', type: 'quarantena', rowStart: rowStart, rowEnd: rowStart + 3, colStart: colEnd - 13, colEnd: colEnd - 10 },
  { id: 'c3', name: 'C3', type: 'quarantena', rowStart: rowStart, rowEnd: rowStart + 3, colStart: colEnd - 8, colEnd: colEnd - 5 },
  { id: 'c4', name: 'C4', type: 'quarantena', rowStart: rowStart, rowEnd: rowStart + 3, colStart: colEnd - 3, colEnd: colEnd },
  {
    id: 'cuarentena-band',
    name: 'Cuarentena',
    type: 'quarantena',
    rowStart: rowStart + 5,
    rowEnd: rowStart + 6,
    colStart: colEnd - 18,
    colEnd: colEnd,
  },
  { id: 'c6', name: 'C6', type: 'quarantena', rowStart: rowStart + 8, rowEnd: rowStart + 11, colStart: colEnd - 18, colEnd: colEnd - 15 },
  { id: 'c7', name: 'C7', type: 'quarantena', rowStart: rowStart + 8, rowEnd: rowStart + 11, colStart: colEnd - 13, colEnd: colEnd - 10 },
  { id: 'c8', name: 'C8', type: 'quarantena', rowStart: rowStart + 8, rowEnd: rowStart + 11, colStart: colEnd - 8, colEnd: colEnd - 5 },

  // === Patio 1 (debajo de cuarentena) ===
  // { id: 'patio-1', name: 'P1', type: 'patio', rowStart: 10, rowEnd: 16, colStart: 72, colEnd: 94 },

  // === Boxes 7-8 (bajo Patio 1) ===
  {
    id: 'k-8',
    name: '8',
    type: 'chenil-normal',
    rowStart: rowStart + 15,
    rowEnd: rowStart + 17,
    colStart: colEnd - 25,
    colEnd: colEnd - 19,
  },
  {
    id: 'k-7',
    name: '7',
    type: 'chenil-normal',
    rowStart: rowStart + 15,
    rowEnd: rowStart + 17,
    colStart: colEnd - 17,
    colEnd: colEnd - 10,
  },

  // === Boxes 1-6 (fila horizontal derecha) ===
  {
    id: 'k-6',
    name: '6',
    type: 'chenil-normal',
    rowStart: 22,
    rowEnd: 28,
    colStart: colEnd - 28,
    colEnd: colEnd - 25,
  },
  {
    id: 'k-5',
    name: '5',
    type: 'chenil-normal',
    rowStart: 22,
    rowEnd: 28,
    colStart: colEnd - 23,
    colEnd: colEnd - 20,
  },
  {
    id: 'k-4',
    name: '4',
    type: 'chenil-normal',
    rowStart: 22,
    rowEnd: 28,
    colStart: colEnd - 18,
    colEnd: colEnd - 15,
  },
  {
    id: 'k-3',
    name: '3',
    type: 'chenil-normal',
    rowStart: 22,
    rowEnd: 28,
    colStart: colEnd - 13,
    colEnd: colEnd - 10,
  },
  {
    id: 'k-2',
    name: '2',
    type: 'chenil-normal',
    rowStart: 22,
    rowEnd: 28,
    colStart: colEnd - 8,
    colEnd: colEnd - 5,
  },
  {
    id: 'k-1',
    name: '1',
    type: 'chenil-normal',
    rowStart: 22,
    rowEnd: 28,
    colStart: colEnd - 3,
    colEnd: colEnd,
  },

  // === Patios 5, 6, 7 (centro-superior) ===
  {
    id: 'patio-7',
    name: 'P7',
    type: 'patio',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 5,
    colStart: 2,
    colEnd: 7,
  },
  {
    id: 'patio-6',
    name: 'P6',
    type: 'patio',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 5,
    colStart: 9,
    colEnd: 14,
  },
  {
    id: 'patio-5',
    name: 'P5',
    type: 'patio',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 12,
    colStart: colStartPPP,
    colEnd: colStartPPP + 16,
  },

  // === Boxes 9-14 (fila entre Patio 5 y Patio 3) ===
  {
    id: 'k-14',
    name: '14',
    type: 'chenil-normal',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 12,
    colStart: 34,
    colEnd: 37,
  },
  {
    id: 'k-13',
    name: '13',
    type: 'chenil-normal',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 3,
    colStart: 39,
    colEnd: 42,
  },
  {
    id: 'k-12',
    name: '12',
    type: 'chenil-normal',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 3,
    colStart: 44,
    colEnd: 47,
  },
  {
    id: 'k-11',
    name: '11',
    type: 'chenil-normal',
    rowStart: rowStartPPP,
    rowEnd: rowStartPPP + 3,
    colStart: 49,
    colEnd: 52,
  },
  {
    id: 'k-9',
    name: '9',
    type: 'chenil-normal',
    rowStart: rowStartPPP - 3,
    rowEnd: rowStartPPP + 2,
    colStart: 59,
    colEnd: 62,
  },

  // === Patio 3 y 4 (centro) ===
  {
    id: 'patio-3',
    name: 'P3',
    type: 'patio',
    rowStart: rowStartPPP + 5,
    rowEnd: rowStartPPP + 12,
    colStart: 39,
    colEnd: 55,
  },
  {
    id: 'patio-4',
    name: 'P4',
    type: 'patio',
    rowStart: rowStartPPP + 14,
    rowEnd: rowStartPPP + 40,
    colStart: colStartPPP + 17,
    colEnd: colStartPPP + 39,
  },

  // === Patio 11 (grande, izquierda) ===
  //   { id: 'patio-11', name: 'P11', type: 'patio', rowStart: 24, rowEnd: 40, colStart: 3, colEnd: 22 },

  // === Boxes 23-27 (pila vertical, centro-inferior) ===
  {
    id: 'k-28',
    name: '28',
    type: 'chenil-normal',
    rowStart: rowEnd - 28,
    rowEnd: rowEnd - 25,
    colStart: colStartPPP,
    colEnd: colStartPPP + 7,
  },
  {
    id: 'k-27',
    name: '27',
    type: 'chenil-normal',
    rowStart: rowEnd - 23,
    rowEnd: rowEnd - 20,
    colStart: colStartPPP,
    colEnd: colStartPPP + 7,
  },
  {
    id: 'k-26',
    name: '26',
    type: 'chenil-normal',
    rowStart: rowEnd - 18,
    rowEnd: rowEnd - 15,
    colStart: colStartPPP,
    colEnd: colStartPPP + 7,
  },
  {
    id: 'k-25',
    name: '25',
    type: 'chenil-normal',
    rowStart: rowEnd - 13,
    rowEnd: rowEnd - 10,
    colStart: colStartPPP,
    colEnd: colStartPPP + 7,
  },
  {
    id: 'k-24',
    name: '24',
    type: 'chenil-normal',
    rowStart: rowEnd - 8,
    rowEnd: rowEnd - 5,
    colStart: colStartPPP,
    colEnd: colStartPPP + 7,
  },
  {
    id: 'k-23',
    name: '23',
    type: 'chenil-normal',
    rowStart: rowEnd - 3,
    rowEnd: rowEnd,
    colStart: colStartPPP,
    colEnd: colStartPPP + 7,
  },

  // === S1, S2, S3 (chenils solitarios, centro-inferior) ===
  {
    id: 's-3',
    name: 'S3',
    type: 'chenil-solitari',
    rowStart: rowEnd - 3,
    rowEnd: rowEnd,
    colStart: colStartPPP + 10,
    colEnd: colStartPPP + 15,
  },
  {
    id: 's-2',
    name: 'S2',
    type: 'chenil-solitari',
    rowStart: rowEnd - 3,
    rowEnd: rowEnd,
    colStart: colStartPPP + 17,
    colEnd: colStartPPP + 22,
  },
  {
    id: 's-1',
    name: 'S1',
    type: 'chenil-solitari',
    rowStart: rowEnd - 3,
    rowEnd: rowEnd,
    colStart: colStartPPP + 24,
    colEnd: colStartPPP + 29,
  },

  // === Boxes 15-22 (pila vertical, derecha) ===
  {
    id: 'k-16',
    name: '16',
    type: 'chenil-normal',
    rowStart: rowEnd - 33,
    rowEnd: rowEnd - 30,
    colStart: 62,
    colEnd: 68,
  },
  {
    id: 'k-17',
    name: '17',
    type: 'chenil-normal',
    rowStart: rowEnd - 28,
    rowEnd: rowEnd - 25,
    colStart: 62,
    colEnd: 68,
  },
  {
    id: 'k-18',
    name: '18',
    type: 'chenil-normal',
    rowStart: rowEnd - 23,
    rowEnd: rowEnd - 20,
    colStart: 62,
    colEnd: 68,
  },
  {
    id: 'k-19',
    name: '19',
    type: 'chenil-normal',
    rowStart: rowEnd - 18,
    rowEnd: rowEnd - 15,
    colStart: 62,
    colEnd: 68,
  },
  {
    id: 'k-20',
    name: '20',
    type: 'chenil-normal',
    rowStart: rowEnd - 13,
    rowEnd: rowEnd - 10,
    colStart: 62,
    colEnd: 68,
  },
  {
    id: 'k-21',
    name: '21',
    type: 'chenil-normal',
    rowStart: rowEnd - 8,
    rowEnd: rowEnd - 5,
    colStart: 62,
    colEnd: 68,
  },
  {
    id: 'k-22',
    name: '22',
    type: 'chenil-normal',
    rowStart: rowEnd - 3,
    rowEnd: rowEnd,
    colStart: 62,
    colEnd: 68,
  },

  {
    id: 'patio-9',
    name: 'P9',
    type: 'patio',
    rowStart: rowEnd - 44,
    rowEnd: rowEnd - 35,
    colStart: colEnd - 19,
    colEnd: colEnd,
  },
  {
    id: 'patio-10',
    name: 'P10',
    type: 'patio',
    rowStart: rowEnd - 33,
    rowEnd: rowEnd,
    colStart: colEnd - 29,
    colEnd: colEnd,
  },
];

interface AssignmentRow {
  region_id: string;
  dog_id: string;
  position: number;
}

/**
 * Reactive service for the shelter map. Regions are static; assignments are
 * persisted in Supabase and synced live across devices via Realtime.
 */
@Injectable({ providedIn: 'root' })
export class ShelterMapService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  /** All shelter regions (static layout, not persisted). */
  readonly regions = signal<ShelterRegion[]>(DEFAULT_REGIONS);

  /** region-id -> ordered list of dog-ids currently assigned. */
  readonly assignments = signal<ShelterAssignments>(loadCache());

  /** dog-id -> region-id (reverse index, recomputed). */
  readonly regionByDog = computed<Record<string, string>>(() => {
    const index: Record<string, string> = {};
    for (const [regionId, dogIds] of Object.entries(this.assignments())) {
      for (const dogId of dogIds) {
        index[dogId] = regionId;
      }
    }
    return index;
  });

  /** region-id -> dog count (for badges on the map). */
  readonly dogCountByRegion = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const [regionId, dogIds] of Object.entries(this.assignments())) {
      counts[regionId] = dogIds.length;
    }
    return counts;
  });

  private channel: RealtimeChannel | null = null;

  constructor() {
    void this.refresh();
    this.subscribeToRealtime();

    // Persist cache for instant startup / offline.
    effect(() => {
      const snapshot = this.assignments();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore storage errors (private mode / quota).
      }
    });
  }

  /** Force reload from Supabase. */
  async refresh(): Promise<void> {
    const { data, error } = await this.supabase
      .from('shelter_assignments')
      .select('region_id, dog_id, position')
      .order('position', { ascending: true });

    if (error) return;

    const next: ShelterAssignments = {};
    for (const row of (data ?? []) as AssignmentRow[]) {
      if (!next[row.region_id]) next[row.region_id] = [];
      next[row.region_id].push(row.dog_id);
    }
    this.assignments.set(next);
  }

  /**
   * Assign a dog to a region. Removes it from any previous region first
   * (a dog can only be in one region at a time; enforced by UNIQUE(dog_id)).
   */
  async assignDog(dogId: string, regionId: string): Promise<void> {
    const previous = this.assignments();

    // Optimistic update.
    this.assignments.update((current) => {
      const next: ShelterAssignments = {};
      for (const [rid, dogIds] of Object.entries(current)) {
        next[rid] = dogIds.filter((id) => id !== dogId);
      }
      const existing = next[regionId] ?? [];
      next[regionId] = existing.includes(dogId) ? existing : [...existing, dogId];
      return next;
    });

    // Push to Supabase: delete any existing row for this dog, then insert.
    const del = await this.supabase.from('shelter_assignments').delete().eq('dog_id', dogId);

    if (del.error) {
      this.assignments.set(previous);
      return;
    }

    const ins = await this.supabase
      .from('shelter_assignments')
      .insert({ region_id: regionId, dog_id: dogId, position: Date.now() });

    if (ins.error) {
      this.assignments.set(previous);
    }
  }

  /** Remove a dog from a region (no-op if not present). */
  async removeDog(dogId: string, regionId: string): Promise<void> {
    const current = this.assignments();
    const dogIds = current[regionId];
    if (!dogIds || !dogIds.includes(dogId)) return;

    const previous = current;
    this.assignments.set({
      ...current,
      [regionId]: dogIds.filter((id) => id !== dogId),
    });

    const { error } = await this.supabase
      .from('shelter_assignments')
      .delete()
      .eq('dog_id', dogId)
      .eq('region_id', regionId);

    if (error) {
      this.assignments.set(previous);
    }
  }

  /** Clear all dogs from a region. */
  async clearRegion(regionId: string): Promise<void> {
    const current = this.assignments();
    if (!current[regionId] || current[regionId].length === 0) return;

    const previous = current;
    this.assignments.set({ ...current, [regionId]: [] });

    const { error } = await this.supabase
      .from('shelter_assignments')
      .delete()
      .eq('region_id', regionId);

    if (error) {
      this.assignments.set(previous);
    }
  }

  /**
   * Remove a dog from any region it may be in.
   * Called when a dog is adopted, transferred, deceased or deleted.
   */
  async unassignDog(dogId: string): Promise<void> {
    const previous = this.assignments();

    this.assignments.update((current) => {
      const next: ShelterAssignments = {};
      for (const [rid, dogIds] of Object.entries(current)) {
        next[rid] = dogIds.filter((id) => id !== dogId);
      }
      return next;
    });

    const { error } = await this.supabase.from('shelter_assignments').delete().eq('dog_id', dogId);

    if (error) {
      this.assignments.set(previous);
    }
  }

  private subscribeToRealtime(): void {
    this.channel = this.supabase
      .channel('gossera-assignments')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'shelter_assignments' },
        () => void this.refresh(),
      )
      .subscribe();
  }
}

function loadCache(): ShelterAssignments {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ShelterAssignments;
    }
  } catch {
    // Fall through.
  }
  return {};
}
