import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Dog } from '../../core/models/dog.model';
import { Walk } from '../../core/models/walk.model';
import { AuthService } from '../../core/services/auth.service';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { WalkRepositoryService } from '../../core/services/walk-repository.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-walks-page',
  imports: [DatePipe],
  templateUrl: './walks-page.component.html',
  styleUrl: './walks-page.component.scss'
})
export class WalksPageComponent {
  private readonly walkRepository = inject(WalkRepositoryService);
  private readonly dogRepository = inject(DogRepositoryService);
  private readonly auth = inject(AuthService);

  readonly query = signal('');

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
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
