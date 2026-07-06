import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dog } from '../../core/models/dog.model';
import { Walk } from '../../core/models/walk.model';
import { AuthService } from '../../core/services/auth.service';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { WalkRepositoryService } from '../../core/services/walk-repository.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-walks-page',
  imports: [DatePipe, FormsModule],
  templateUrl: './walks-page.component.html',
  styleUrl: './walks-page.component.scss'
})
export class WalksPageComponent {
  private readonly walkRepository = inject(WalkRepositoryService);
  private readonly dogRepository = inject(DogRepositoryService);
  private readonly auth = inject(AuthService);

  readonly query = signal('');

  // === Borrado ===
  readonly deleteConfirmId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  // === Edición ===
  readonly editingId = signal<string | null>(null);
  /** Valor del datetime-local input (formato "yyyy-MM-ddTHH:mm"). */
  readonly editFecha = signal<string>('');
  readonly editNotas = signal<string>('');
  readonly savingEdit = signal<boolean>(false);
  readonly editError = signal<string | null>(null);

  readonly recentWalks = computed(() => this.walkRepository.recent());

  readonly walksToday = computed(() => {
    const start = startOfToday();
    return this.recentWalks().filter((w) => new Date(w.fecha).getTime() >= start).length;
  });

  readonly walksLastWeek = computed(() => {
    const threshold = Date.now() - 7 * DAY_MS;
    return this.recentWalks().filter((w) => new Date(w.fecha).getTime() >= threshold).length;
  });

  readonly filteredWalks = computed<{ walk: Walk; dog?: Dog }[]>(() => {
    const dogsById = new Map(this.dogRepository.dogs().map((d) => [d.id, d]));
    const q = this.query().trim().toLowerCase();

    return this.recentWalks()
      .map((walk) => ({ walk, dog: dogsById.get(walk.dogId) }))
      .filter(({ dog }) => {
        if (!q) return true;
        if (!dog) return false;
        return (
          dog.nombre.toLowerCase().includes(q) ||
          (dog.codigo ?? '').toLowerCase().includes(q) ||
          dog.raza.toLowerCase().includes(q)
        );
      });
  });

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /** Turn a stored email into the display username. */
  formatUser(email: string | undefined): string {
    return this.auth.formatEmail(email);
  }

  // === Borrado de paseos ===

  askDelete(walkId: string): void {
    // Si estábamos editando ese mismo paseo, salimos del modo edición.
    if (this.editingId() === walkId) this.cancelEdit();
    this.deleteError.set(null);
    this.deleteConfirmId.set(walkId);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
    this.deleteError.set(null);
  }

  async confirmDelete(walkId: string): Promise<void> {
    this.deletingId.set(walkId);
    this.deleteError.set(null);

    const result = await this.walkRepository.deleteWalk(walkId);

    this.deletingId.set(null);
    if (!result.ok) {
      this.deleteError.set(result.message);
      return;
    }
    this.deleteConfirmId.set(null);
  }

  // === Edición de paseos ===

  askEdit(walk: Walk): void {
    // Si estábamos confirmando borrado en esa fila, salimos.
    if (this.deleteConfirmId() === walk.id) this.cancelDelete();
    this.editError.set(null);
    this.editFecha.set(isoToDatetimeLocal(walk.fecha));
    this.editNotas.set(walk.notas ?? '');
    this.editingId.set(walk.id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editError.set(null);
    this.savingEdit.set(false);
  }

  async saveEdit(walk: Walk): Promise<void> {
    if (this.savingEdit()) return;

    const local = this.editFecha().trim();
    if (!local) {
      this.editError.set('La fecha es obligatoria.');
      return;
    }
    const iso = datetimeLocalToIso(local);
    if (!iso) {
      this.editError.set('Fecha inválida.');
      return;
    }

    this.savingEdit.set(true);
    this.editError.set(null);

    const patch: { fecha?: string; notas?: string | null } = {};
    if (iso !== walk.fecha) patch.fecha = iso;

    const trimmedNotas = this.editNotas().trim();
    const nextNotas = trimmedNotas.length > 0 ? trimmedNotas : null;
    const currentNotas = walk.notas ?? null;
    if (nextNotas !== currentNotas) patch.notas = nextNotas;

    if (Object.keys(patch).length === 0) {
      // Nada que cambiar.
      this.savingEdit.set(false);
      this.editingId.set(null);
      return;
    }

    const result = await this.walkRepository.updateWalk(walk.id, patch);

    this.savingEdit.set(false);
    if (!result.ok) {
      this.editError.set(result.message);
      return;
    }
    this.editingId.set(null);
  }
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * ISO 8601 → valor que espera `<input type="datetime-local">` (en hora
 * local del navegador, sin zona horaria y sin segundos).
 */
function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valor del datetime-local (hora local) → ISO 8601 UTC. Devuelve '' si es inválido. */
function datetimeLocalToIso(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}
