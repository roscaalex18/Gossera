import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { DogWalkPriority } from '../../core/models/dog.model';

type FilterMode = 'todos' | 'soloPendientes';

@Component({
  selector: 'app-dogs-page',
  imports: [DatePipe, NgClass],
  templateUrl: './dogs-page.component.html',
  styleUrl: './dogs-page.component.scss'
})
export class DogsPageComponent {
  private readonly dogRepository = inject(DogRepositoryService);

  readonly filterMode = signal<FilterMode>('todos');
  readonly dogs = computed(() => {
    const allDogs = this.dogRepository.dogs();

    if (this.filterMode() === 'soloPendientes') {
      return allDogs.filter((dog) => dog.necesitaPaseoHoy);
    }

    return allDogs;
  });

  readonly totalDogs = computed(() => this.dogRepository.dogs().length);
  readonly pendingDogs = computed(
    () => this.dogRepository.dogs().filter((dog) => dog.necesitaPaseoHoy).length
  );

  setFilter(mode: FilterMode): void {
    this.filterMode.set(mode);
  }

  trackByDogId(_index: number, dog: { id: string }): string {
    return dog.id;
  }

  priorityClass(priority: DogWalkPriority): string {
    return `priority-${priority}`;
  }
}
