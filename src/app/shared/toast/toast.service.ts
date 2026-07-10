import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

const DEFAULT_TIMEOUT_MS: Record<ToastVariant, number> = {
  success: 2800,
  info: 3200,
  error: 5000
};

/**
 * Toast global. Cualquier servicio o componente puede llamar
 * `toast.success('Paseo registrado')` para mostrar un aviso.
 *
 *  - Se apilan en el `ToastContainerComponent`, más recientes abajo.
 *  - Auto-dismiss por tipo (errores duran más para que dé tiempo a leerlos).
 *  - Se pueden cerrar manualmente pulsándolos.
 *  - Estado 100% reactivo (signal), no depende de Zone / RxJS.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, timeoutMs?: number): void {
    this.push({ variant: 'success', message }, timeoutMs);
  }

  error(message: string, timeoutMs?: number): void {
    this.push({ variant: 'error', message }, timeoutMs);
  }

  info(message: string, timeoutMs?: number): void {
    this.push({ variant: 'info', message }, timeoutMs);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(base: Omit<Toast, 'id'>, timeoutMs?: number): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, ...base };
    this.toasts.update((list) => [...list, toast]);

    const ms = timeoutMs ?? DEFAULT_TIMEOUT_MS[toast.variant];
    if (ms > 0) {
      setTimeout(() => this.dismiss(id), ms);
    }
  }
}
