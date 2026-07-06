import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Dog, DogWalkPriority } from '../../core/models/dog.model';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { ShelterMapService } from '../../core/services/shelter-map.service';

@Component({
  selector: 'app-dog-card',
  imports: [DatePipe, NgClass],
  templateUrl: './dog-card.component.html',
  styleUrl: './dog-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DogCardComponent {
  private readonly shelterMap = inject(ShelterMapService);
  private readonly dogRepository = inject(DogRepositoryService);

  readonly dog = input.required<Dog>();
  /** When true renders a more compact version (used inside the map bottom sheet). */
  readonly compact = input<boolean>(false);
  /**
   * When true, shows a floating ★ button in the top-right of the photo that
   * toggles the "destacado" (prioridad máxima) flag directly from the list.
   */
  readonly showStarToggle = input<boolean>(false);

  /** Nombre del box/zona en el que está el perro (o `null` si no tiene asignación). */
  readonly boxName = computed<string | null>(() => {
    const regionId = this.shelterMap.regionByDog()[this.dog().id];
    if (!regionId) return null;
    return this.shelterMap.regions().find((r) => r.id === regionId)?.name ?? null;
  });

  /** `true` si alguno de los flags de seguridad está activo (PPP, bozal, cuidado M/F). */
  readonly hasSafetyFlags = computed<boolean>(() => {
    const d = this.dog();
    return d.esPPP || d.bozalObligatorio || d.cuidadoMachos || d.cuidadoHembras;
  });

  priorityClass(priority: DogWalkPriority): string {
    return `priority-${priority}`;
  }

  /**
   * Alterna la flag `destacado` del perro. Se llama desde el botón ★
   * flotante y necesita frenar la propagación para no abrir el detalle.
   */
  toggleDestacado(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    void this.dogRepository.toggleDestacado(this.dog().id);
  }
}
