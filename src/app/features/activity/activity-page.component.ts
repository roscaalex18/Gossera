import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivityAction, ActivityEntry } from '../../core/models/activity-log.model';
import { ActivityLogService } from '../../core/services/activity-log.service';
import { AuthService } from '../../core/services/auth.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Resumen agregado por usuario para el bloque "Top usuarios". */
interface UserStats {
  email: string;
  displayName: string;
  count: number;
  lastAt: string;
}

/** Metadatos visuales de cada tipo de acción (chip de color + etiqueta). */
interface ActionMeta {
  label: string;
  variant: 'create' | 'update' | 'delete' | 'walk' | 'paw' | 'auth' | 'other';
}

const ACTION_META: Record<string, ActionMeta> = {
  'dog.create': { label: 'Perro añadido', variant: 'create' },
  'dog.update': { label: 'Ficha editada', variant: 'update' },
  'dog.delete': { label: 'Perro eliminado', variant: 'delete' },
  'dog.destacar': { label: 'Prioridad', variant: 'paw' },
  'walk.log': { label: 'Paseo', variant: 'walk' },
  'walk.update': { label: 'Paseo editado', variant: 'update' },
  'walk.delete': { label: 'Paseo eliminado', variant: 'delete' },
  'auth.login': { label: 'Inicio sesión', variant: 'auth' },
  'auth.logout': { label: 'Cierre sesión', variant: 'auth' }
};

@Component({
  selector: 'app-activity-page',
  imports: [DatePipe],
  templateUrl: './activity-page.component.html',
  styleUrl: './activity-page.component.scss'
})
export class ActivityPageComponent {
  private readonly activityLog = inject(ActivityLogService);
  private readonly auth = inject(AuthService);

  readonly entries = computed(() => this.activityLog.entries());
  readonly last7Days = computed(() => this.activityLog.last7Days());

  readonly countToday = computed(() => {
    const start = startOfToday();
    return this.entries().filter((e) => new Date(e.createdAt).getTime() >= start).length;
  });

  readonly countLast7Days = computed(() => this.last7Days().length);

  /** Emails distintos que han hecho algo en los últimos 7 días. */
  readonly activeUsersCount = computed(() => {
    const emails = new Set<string>();
    for (const e of this.last7Days()) {
      if (e.userEmail) emails.add(e.userEmail);
    }
    return emails.size;
  });

  /** Top usuarios (últimos 7 días), ordenados por número de acciones desc. */
  readonly topUsers = computed<UserStats[]>(() => {
    const byUser = new Map<string, UserStats>();
    for (const e of this.last7Days()) {
      if (!e.userEmail) continue;
      const existing = byUser.get(e.userEmail);
      if (existing) {
        existing.count++;
        if (e.createdAt > existing.lastAt) existing.lastAt = e.createdAt;
      } else {
        byUser.set(e.userEmail, {
          email: e.userEmail,
          displayName: this.auth.formatEmail(e.userEmail),
          count: 1,
          lastAt: e.createdAt
        });
      }
    }
    return [...byUser.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  });

  formatUser(email: string | undefined): string {
    return this.auth.formatEmail(email) || 'Sin registrar';
  }

  actionMeta(action: ActivityAction): ActionMeta {
    return ACTION_META[action] ?? { label: action, variant: 'other' };
  }

  trackByEntryId(_index: number, entry: ActivityEntry): string {
    return entry.id;
  }
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
