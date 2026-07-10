import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  private readonly toast = inject(ToastService);

  readonly toasts = this.toast.toasts;

  dismiss(id: string): void {
    this.toast.dismiss(id);
  }
}
