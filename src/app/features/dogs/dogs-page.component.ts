import { Component, computed, inject, signal } from '@angular/core';
import { Dog, isWalkOverdue, walkUrgencyScore } from '../../core/models/dog.model';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { DogCardComponent } from '../../shared/dog-card/dog-card.component';
import { DogDetailSheetComponent } from './dog-detail-sheet.component';
import { NewDogSheetComponent } from './new-dog-sheet.component';

@Component({
  selector: 'app-dogs-page',
  imports: [DogCardComponent, DogDetailSheetComponent, NewDogSheetComponent],
  templateUrl: './dogs-page.component.html',
  styleUrl: './dogs-page.component.scss'
})
export class DogsPageComponent {
  private readonly dogRepository = inject(DogRepositoryService);

  // === Búsqueda ===
  readonly searchQuery = signal('');

  // === Filtros (multi-toggle) ===
  readonly onlyPending = signal(false);
  readonly onlyHighPriority = signal(false);
  readonly onlyPPP = signal(false);
  readonly onlyDestacados = signal(false);
  readonly onlyNoPatio = signal(false);

  readonly editingDogId = signal<string | null>(null);
  readonly creatingNew = signal(false);

  /**
   * Lista visible: sólo perros activos, aplicando búsqueda + filtros y
   * ordenando destacados primero y luego por urgencia de paseo
   * (días desde el último paseo / intervalo objetivo según prioridad).
   */
  readonly dogs = computed<Dog[]>(() => {
    const now = Date.now();
    let list = this.dogRepository.dogs().filter((d) => d.estado === 'activo');

    // ---- Búsqueda por nombre / código / raza / color ----
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.nombre.toLowerCase().includes(q) ||
          (d.codigo ?? '').toLowerCase().includes(q) ||
          d.raza.toLowerCase().includes(q) ||
          (d.color ?? '').toLowerCase().includes(q)
      );
    }

    // ---- Flags booleanos ----
    if (this.onlyPending()) list = list.filter((d) => isWalkOverdue(d, now));
    if (this.onlyHighPriority()) list = list.filter((d) => d.prioridadPaseo === 'alta');
    if (this.onlyPPP()) list = list.filter((d) => d.esPPP);
    if (this.onlyDestacados()) list = list.filter((d) => d.destacado);
    if (this.onlyNoPatio()) list = list.filter((d) => d.sinPatio);

    return [...list].sort((a, b) => {
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return walkUrgencyScore(b, now) - walkUrgencyScore(a, now);
    });
  });

  readonly totalDogs = computed(
    () => this.dogRepository.dogs().filter((d) => d.estado === 'activo').length
  );

  readonly pendingDogs = computed(() => {
    const now = Date.now();
    return this.dogRepository
      .dogs()
      .filter((d) => d.estado === 'activo' && isWalkOverdue(d, now)).length;
  });

  readonly hasActiveFilter = computed(
    () =>
      !!this.searchQuery().trim() ||
      this.onlyPending() ||
      this.onlyHighPriority() ||
      this.onlyPPP() ||
      this.onlyDestacados() ||
      this.onlyNoPatio()
  );

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  toggleOnlyPending(): void {
    this.onlyPending.update((v) => !v);
  }

  toggleOnlyHighPriority(): void {
    this.onlyHighPriority.update((v) => !v);
  }

  toggleOnlyPPP(): void {
    this.onlyPPP.update((v) => !v);
  }

  toggleOnlyDestacados(): void {
    this.onlyDestacados.update((v) => !v);
  }

  toggleOnlyNoPatio(): void {
    this.onlyNoPatio.update((v) => !v);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.onlyPending.set(false);
    this.onlyHighPriority.set(false);
    this.onlyPPP.set(false);
    this.onlyDestacados.set(false);
    this.onlyNoPatio.set(false);
  }

  openDetail(dogId: string): void {
    this.editingDogId.set(dogId);
  }

  closeDetail(): void {
    this.editingDogId.set(null);
  }

  openNewDog(): void {
    this.creatingNew.set(true);
  }

  closeNewDog(): void {
    this.creatingNew.set(false);
  }

  /** After creating a new dog, jump straight into its detail sheet. */
  onDogCreated(id: string): void {
    this.editingDogId.set(id);
  }

  trackByDogId(_index: number, dog: { id: string }): string {
    return dog.id;
  }
}
