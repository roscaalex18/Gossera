import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dog } from '../../core/models/dog.model';
import { DogRepositoryService, UpdateDogPatch } from '../../core/services/dog-repository.service';
import { ShelterMapService } from '../../core/services/shelter-map.service';

@Component({
  selector: 'app-edit-dog-modal',
  imports: [FormsModule],
  templateUrl: './edit-dog-modal.component.html',
  styleUrl: './edit-dog-modal.component.scss'
})
export class EditDogModalComponent {
  private readonly dogRepository = inject(DogRepositoryService);
  private readonly shelterMap = inject(ShelterMapService);

  readonly dogId = input.required<string>();
  readonly close = output<void>();

  /** Live snapshot desde el repositorio (para foto/estado mostrado en cabecera). */
  readonly dog = computed<Dog | null>(
    () => this.dogRepository.dogs().find((d) => d.id === this.dogId()) ?? null
  );

  // === Estado del formulario ===
  readonly nombre = signal('');
  readonly raza = signal('');
  readonly edad = signal<number>(0);
  readonly energia = signal<'alta' | 'media' | 'baja'>('media');
  readonly prioridadPaseo = signal<'alta' | 'media' | 'baja'>('media');
  readonly sexo = signal<'male' | 'female' | ''>('');
  readonly color = signal('');
  readonly estado = signal<Dog['estado']>('activo');
  readonly esPPP = signal(false);
  readonly bozalObligatorio = signal(false);
  readonly cuidadoMachos = signal(false);
  readonly cuidadoHembras = signal(false);
  readonly notas = signal('');

  // === Estado UI ===
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly deleteConfirm = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Se marca a true una vez que hemos volcado los valores iniciales del perro. */
  private hydrated = false;

  constructor() {
    // Rellena el formulario la primera vez que el perro está disponible.
    effect(() => {
      const d = this.dog();
      if (!d || this.hydrated) return;
      untracked(() => {
        this.nombre.set(d.nombre);
        this.raza.set(d.raza);
        this.edad.set(d.edad);
        this.energia.set(d.energia);
        this.prioridadPaseo.set(d.prioridadPaseo);
        this.sexo.set(d.sexo ?? '');
        this.color.set(d.color ?? '');
        this.estado.set(d.estado);
        this.esPPP.set(d.esPPP);
        this.bozalObligatorio.set(d.bozalObligatorio);
        this.cuidadoMachos.set(d.cuidadoMachos);
        this.cuidadoHembras.set(d.cuidadoHembras);
        this.notas.set(d.notas ?? '');
      });
      this.hydrated = true;
    });
  }

  readonly busy = computed(
    () => this.saving() || this.uploading()
  );

  readonly canSave = computed(
    () =>
      this.nombre().trim().length > 0 &&
      this.raza().trim().length > 0 &&
      !this.busy()
  );

  // === Guardar cambios ===

  async save(): Promise<void> {
    if (!this.canSave()) return;
    const current = this.dog();
    if (!current) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const nextEstado = this.estado();
    const patch: UpdateDogPatch = {
      nombre: this.nombre().trim(),
      raza: this.raza().trim(),
      edad: Number.isFinite(this.edad()) ? Number(this.edad()) : 0,
      energia: this.energia(),
      prioridadPaseo: this.prioridadPaseo(),
      sexo: this.sexo() || undefined,
      color: this.color().trim() || undefined,
      notas: this.notas().trim() || undefined,
      estado: nextEstado,
      esPPP: this.esPPP(),
      bozalObligatorio: this.bozalObligatorio(),
      cuidadoMachos: this.cuidadoMachos(),
      cuidadoHembras: this.cuidadoHembras()
    };

    const result = await this.dogRepository.updateDog(current.id, patch);
    if (!result.ok) {
      this.errorMessage.set(result.message);
      this.saving.set(false);
      return;
    }

    // Efecto colateral: al dejar de estar activo, liberamos el box.
    if (current.estado === 'activo' && nextEstado !== 'activo') {
      await this.shelterMap.unassignDog(current.id);
    }

    this.saving.set(false);
    this.close.emit();
  }

  // === Marcar como adoptado (atajo) ===

  async markAsAdopted(): Promise<void> {
    if (this.busy()) return;
    const current = this.dog();
    if (!current || current.estado !== 'activo') return;

    this.estado.set('adoptado');
    await this.save();
  }

  // === Fotos ===

  async onFilesSelected(input: HTMLInputElement): Promise<void> {
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (files.length === 0) return;

    const current = this.dog();
    if (!current) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    for (const file of files) {
      const result = await this.dogRepository.addPhoto(current.id, file);
      if (!result.ok) {
        this.errorMessage.set(result.message);
        break;
      }
    }
    this.uploading.set(false);
  }

  async removePhoto(url: string): Promise<void> {
    const current = this.dog();
    if (!current) return;
    await this.dogRepository.removePhoto(current.id, url);
  }

  async makePrimary(url: string): Promise<void> {
    const current = this.dog();
    if (!current) return;
    await this.dogRepository.setPrimaryPhoto(current.id, url);
  }

  // === Eliminar perro ===

  askDelete(): void {
    this.deleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(false);
  }

  async confirmDelete(): Promise<void> {
    const current = this.dog();
    if (!current) return;
    await this.shelterMap.unassignDog(current.id);
    await this.dogRepository.deleteDog(current.id);
    this.close.emit();
  }

  // === Cierre del modal ===

  onBackdropClick(): void {
    if (this.busy()) return;
    this.close.emit();
  }

  onCloseClick(): void {
    if (this.busy()) return;
    this.close.emit();
  }
}
