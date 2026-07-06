import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dog } from '../../core/models/dog.model';
import { AuthService } from '../../core/services/auth.service';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { WalkRepositoryService } from '../../core/services/walk-repository.service';
import { EditDogModalComponent } from './edit-dog-modal.component';

@Component({
  selector: 'app-dog-detail-sheet',
  imports: [DatePipe, FormsModule, EditDogModalComponent],
  templateUrl: './dog-detail-sheet.component.html',
  styleUrl: './dog-detail-sheet.component.scss'
})
export class DogDetailSheetComponent {
  private readonly dogRepository = inject(DogRepositoryService);
  private readonly walkRepository = inject(WalkRepositoryService);
  private readonly auth = inject(AuthService);

  readonly dogId = input.required<string>();
  readonly close = output<void>();

  // === Local UI state ===
  readonly registeringWalk = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editing = signal(false);

  readonly walkNote = signal('');

  readonly dog = computed<Dog | null>(
    () => this.dogRepository.dogs().find((d) => d.id === this.dogId()) ?? null
  );

  readonly isActive = computed(() => this.dog()?.estado === 'activo');

  /** `true` si el perro tiene algún flag de seguridad activo. */
  readonly hasSafetyFlags = computed<boolean>(() => {
    const d = this.dog();
    if (!d) return false;
    return d.esPPP || d.bozalObligatorio || d.cuidadoMachos || d.cuidadoHembras;
  });

  readonly walks = computed(() =>
    this.walkRepository.forDog(this.dogId()).slice(0, 5)
  );

  /** Turn a stored email into the display username. */
  formatUser(email: string | undefined): string {
    return this.auth.formatEmail(email);
  }

  sexoLabel(sexo: Dog['sexo']): string {
    if (sexo === 'male') return 'Macho';
    if (sexo === 'female') return 'Hembra';
    return '—';
  }

  estadoLabel(estado: Dog['estado']): string {
    switch (estado) {
      case 'activo':      return 'Activo';
      case 'adoptado':    return 'Adoptado';
      case 'trasladado':  return 'Trasladado';
      case 'fallecido':   return 'Fallecido';
    }
  }

  // === Walk ===

  async registerWalk(): Promise<void> {
    const dog = this.dog();
    if (!dog || !this.isActive()) return;

    this.registeringWalk.set(true);
    this.errorMessage.set(null);

    const notes = this.walkNote().trim() || undefined;

    const logged = await this.walkRepository.logWalk(dog.id, notes);
    if (!logged.ok) {
      this.errorMessage.set(logged.message);
      this.registeringWalk.set(false);
      return;
    }

    // Update dog cache fields (best-effort; ignore errors).
    await this.dogRepository.markWalked(dog.id, new Date(logged.walk.fecha));

    this.walkNote.set('');
    this.registeringWalk.set(false);
  }

  // === Modal editar ficha ===

  openEdit(): void {
    this.editing.set(true);
  }

  closeEdit(): void {
    this.editing.set(false);
  }

  // === Prioridad máxima (destacar) ===

  /** Alterna el flag `destacado` sin pasar por el modal de edición. */
  async toggleDestacado(): Promise<void> {
    const dog = this.dog();
    if (!dog) return;
    await this.dogRepository.toggleDestacado(dog.id);
  }

  // === Sheet controls ===

  onBackdropClick(): void {
    if (this.registeringWalk() || this.editing()) return;
    this.close.emit();
  }

  onCloseClick(): void {
    this.close.emit();
  }
}
