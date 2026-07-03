import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Dog, DogWalkPriority } from '../../core/models/dog.model';

@Component({
  selector: 'app-dog-card',
  imports: [DatePipe, NgClass],
  templateUrl: './dog-card.component.html',
  styleUrl: './dog-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DogCardComponent {
  readonly dog = input.required<Dog>();
  /** When true renders a more compact version (used inside the map bottom sheet). */
  readonly compact = input<boolean>(false);

  priorityClass(priority: DogWalkPriority): string {
    return `priority-${priority}`;
  }
}
