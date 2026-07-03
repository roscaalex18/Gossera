import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Dog, DogWalkPriority } from '../../core/models/dog.model';
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

  readonly dog = input.required<Dog>();
  /** When true renders a more compact version (used inside the map bottom sheet). */
  readonly compact = input<boolean>(false);

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
}
