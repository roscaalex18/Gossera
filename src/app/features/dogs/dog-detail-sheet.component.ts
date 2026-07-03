import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dog } from '../../core/models/dog.model';
import { AuthService } from '../../core/services/auth.service';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { ShelterMapService } from '../../core/services/shelter-map.service';
import { WalkRepositoryService } from '../../core/services/walk-repository.service';

@Component({
  selector: 'app-dog-detail-sheet',
  imports: [DatePipe, FormsModule],
  templateUrl: './dog-detail-sheet.component.html',
  styleUrl: './dog-detail-sheet.component.scss'
})
export class DogDetailSheetComponent {
  private readonly dogRepository = inject(DogRepositoryService);
  private readonly walkRepository = inject(WalkRepositoryService);
  private readonly shelterMap = inject(ShelterMapService);
  private readonly auth = inject(AuthService);

  readonly dogId = input.required<string>();
  readonly close = output<void>();

  // === Local UI state ===
  readonly uploading = signal(false);
  readonly savingNotes = signal(false);
  readonly registeringWalk = signal(false);
  readonly markingAdopted = signal(false);
  readonly deleteConfirm = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly walkNote = signal('');
  readonly notasDraft = signal<string | null>(null);

  readonly dog = computed<Dog | null>(
    () => this.dogRepository.dogs().find((d) => d.id === this.dogId()) ?? null
  );

  readonly isActive = computed(() => this.dog()?.estado === 'activo');

  readonly walks = computed(() =>
    this.walkRepository.forDog(this.dogId()).slice(0, 5)
  );

  currentNotesValue(): string {
    return this.notasDraft() ?? this.dog()?.notas ?? '';
  }

  /** Turn a stored email into the display username. */
  formatUser(email: string | undefined): string {
    return this.auth.formatEmail(email);
  }

  // === Photos ===

  async onFilesSelected(input: HTMLInputElement): Promise<void> {
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (files.length === 0) return;

    const dog = this.dog();
    if (!dog) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    for (const file of files) {
      const result = await this.dogRepository.addPhoto(dog.id, file);
      if (!result.ok) {
        this.errorMessage.set(result.message);
        break;
      }
    }
    this.uploading.set(false);
  }

  async removePhoto(url: string): Promise<void> {
    const dog = this.dog();
    if (!dog) return;
    await this.dogRepository.removePhoto(dog.id, url);
  }

  async makePrimary(url: string): Promise<void> {
    const dog = this.dog();
    if (!dog) return;
    await this.dogRepository.setPrimaryPhoto(dog.id, url);
  }

  // === Notes ===

  onNotesInput(event: Event): void {
    this.notasDraft.set((event.target as HTMLTextAreaElement).value);
  }

  async saveNotes(): Promise<void> {
    const draft = this.notasDraft();
    if (draft === null) return;
    const dog = this.dog();
    if (!dog) return;
    if ((dog.notas ?? '') === draft) {
      this.notasDraft.set(null);
      return;
    }

    this.savingNotes.set(true);
    const result = await this.dogRepository.updateDog(dog.id, {
      notas: draft.trim() || undefined
    });
    this.savingNotes.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }
    this.notasDraft.set(null);
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

  // === Adoption ===

  async markAsAdopted(): Promise<void> {
    const dog = this.dog();
    if (!dog || dog.estado !== 'activo') return;

    this.markingAdopted.set(true);
    this.errorMessage.set(null);

    const result = await this.dogRepository.updateDog(dog.id, { estado: 'adoptado' });
    if (!result.ok) {
      this.errorMessage.set(result.message);
      this.markingAdopted.set(false);
      return;
    }

    // Free the box so realtime updates the map immediately.
    await this.shelterMap.unassignDog(dog.id);

    this.markingAdopted.set(false);
    this.close.emit();
  }

  // === Delete ===

  askDelete(): void {
    this.deleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(false);
  }

  async confirmDelete(): Promise<void> {
    const dog = this.dog();
    if (!dog) return;

    // Free the box first so realtime updates the map immediately.
    await this.shelterMap.unassignDog(dog.id);
    await this.dogRepository.deleteDog(dog.id);
    this.close.emit();
  }

  // === Sheet controls ===

  onBackdropClick(): void {
    if (
      this.uploading() ||
      this.registeringWalk() ||
      this.savingNotes() ||
      this.markingAdopted()
    ) {
      return;
    }
    this.close.emit();
  }

  onCloseClick(): void {
    this.close.emit();
  }
}
