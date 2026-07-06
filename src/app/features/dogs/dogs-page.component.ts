import { Component, computed, inject, signal } from '@angular/core';
import { Dog, DogWalkPriority } from '../../core/models/dog.model';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { DogCardComponent } from '../../shared/dog-card/dog-card.component';
import { DogDetailSheetComponent } from './dog-detail-sheet.component';
import { NewDogSheetComponent } from './new-dog-sheet.component';

/** Peso numérico de la prioridad para ordenar (menor = antes). */
const PRIORITY_WEIGHT: Record<DogWalkPriority, number> = {
  alta: 0,
  media: 1,
  baja: 2
};

@Component({
  selector: 'app-dogs-page',
  imports: [DogCardComponent, DogDetailSheetComponent, NewDogSheetComponent],
  templateUrl: './dogs-page.component.html',
  styleUrl: './dogs-page.component.scss'
})
export class DogsPageComponent {
  private readonly dogRepository = inject(DogRepositoryService);

  // === Filtros (multi-toggle) ===
  readonly onlyPending = signal(false);
  readonly onlyHighPriority = signal(false);
  readonly onlyPPP = signal(false);
  readonly onlyDestacados = signal(false);

  readonly editingDogId = signal<string | null>(null);
  readonly creatingNew = signal(false);

  /**
   * Lista visible: sólo perros activos, aplicando los filtros activos y
   * ordenando destacados primero y luego por prioridad de paseo
   * (alta → media → baja).
   */
  readonly dogs = computed<Dog[]>(() => {
    let list = this.dogRepository.dogs().filter((d) => d.estado === 'activo');

    if (this.onlyPending()) list = list.filter((d) => d.necesitaPaseoHoy);
    if (this.onlyHighPriority()) list = list.filter((d) => d.prioridadPaseo === 'alta');
    if (this.onlyPPP()) list = list.filter((d) => d.esPPP);
    if (this.onlyDestacados()) list = list.filter((d) => d.destacado);

    return [...list].sort((a, b) => {
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return PRIORITY_WEIGHT[a.prioridadPaseo] - PRIORITY_WEIGHT[b.prioridadPaseo];
    });
  });

  readonly totalDogs = computed(
    () => this.dogRepository.dogs().filter((d) => d.estado === 'activo').length
  );
  readonly pendingDogs = computed(
    () =>
      this.dogRepository
        .dogs()
        .filter((d) => d.estado === 'activo' && d.necesitaPaseoHoy).length
  );

  readonly hasActiveFilter = computed(
    () =>
      this.onlyPending() ||
      this.onlyHighPriority() ||
      this.onlyPPP() ||
      this.onlyDestacados()
  );

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

  clearFilters(): void {
    this.onlyPending.set(false);
    this.onlyHighPriority.set(false);
    this.onlyPPP.set(false);
    this.onlyDestacados.set(false);
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
