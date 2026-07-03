import { Component, computed, inject, signal } from '@angular/core';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { DogCardComponent } from '../../shared/dog-card/dog-card.component';
import { DogDetailSheetComponent } from './dog-detail-sheet.component';
import { NewDogSheetComponent } from './new-dog-sheet.component';

type FilterMode = 'todos' | 'soloPendientes';

@Component({
  selector: 'app-dogs-page',
  imports: [DogCardComponent, DogDetailSheetComponent, NewDogSheetComponent],
  templateUrl: './dogs-page.component.html',
  styleUrl: './dogs-page.component.scss'
})
export class DogsPageComponent {
  private readonly dogRepository = inject(DogRepositoryService);

  readonly filterMode = signal<FilterMode>('todos');
  readonly editingDogId = signal<string | null>(null);
  readonly creatingNew = signal(false);

  /** Only active dogs are shown in the main list for now. */
  readonly dogs = computed(() => {
    let list = this.dogRepository.dogs().filter((d) => d.estado === 'activo');

    if (this.filterMode() === 'soloPendientes') {
      list = list.filter((d) => d.necesitaPaseoHoy);
    }

    return list;
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

  setFilter(mode: FilterMode): void {
    this.filterMode.set(mode);
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
