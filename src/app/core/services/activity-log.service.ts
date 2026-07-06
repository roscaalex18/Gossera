import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  ActivityAction,
  ActivityEntityType,
  ActivityEntry
} from '../models/activity-log.model';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from './auth.service';

const CACHE_KEY = 'gossera.activity-log.cache.v1';
const RECENT_LIMIT = 500;

interface ActivityRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** Datos que el llamante puede pasar a `log(...)`. El usuario y el timestamp
 *  se rellenan automáticamente desde `AuthService` y el servidor. */
export interface LogInput {
  action: ActivityAction;
  entityType?: ActivityEntityType;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registro inmutable de acciones que se van haciendo en la app.
 *
 *  - `log({...})` — fire-and-forget: nunca bloquea al llamante. Si Supabase
 *    falla, se logea el error por consola y punto (no rompe la mutación).
 *  - `entries()` — últimos 500 registros, más recientes primero. Cache local
 *    para arranque instantáneo + Realtime para ver acciones de otros en vivo.
 */
@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);

  readonly entries = signal<ActivityEntry[]>(loadCache());

  /** Sólo los últimos 7 días, útil para stats "usuarios activos". */
  readonly last7Days = computed<ActivityEntry[]>(() => {
    const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.entries().filter((e) => new Date(e.createdAt).getTime() >= threshold);
  });

  private channel: RealtimeChannel | null = null;

  constructor() {
    void this.refresh();
    this.subscribeToRealtime();

    effect(() => {
      const snapshot = this.entries();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignora errores de cuota.
      }
    });
  }

  async refresh(): Promise<void> {
    const { data, error } = await this.supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT);

    if (error) return;
    this.entries.set(((data ?? []) as ActivityRow[]).map(rowToEntry));
  }

  /**
   * Encola una entrada de log. No espera al servidor: la mutación que llame
   * a este método sigue su curso normal. Si Supabase falla, se registra por
   * consola pero no propaga el error.
   */
  log(input: LogInput): void {
    void this.insertAsync(input);
  }

  private async insertAsync(input: LogInput): Promise<void> {
    const user = this.auth.user();
    const { error } = await this.supabase.from('activity_log').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? null
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[activity_log] no se pudo registrar la acción:', error.message);
    }
  }

  private subscribeToRealtime(): void {
    this.channel = this.supabase
      .channel('gossera-activity-log')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        () => void this.refresh()
      )
      .subscribe();
  }
}

function rowToEntry(row: ActivityRow): ActivityEntry {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    userEmail: row.user_email ?? undefined,
    action: row.action,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    summary: row.summary ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at
  };
}

function loadCache(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}
