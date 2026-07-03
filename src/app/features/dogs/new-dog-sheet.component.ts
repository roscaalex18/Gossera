import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateDogInput,
  DogRepositoryService
} from '../../core/services/dog-repository.service';

@Component({
  selector: 'app-new-dog-sheet',
  imports: [FormsModule],
  templateUrl: './new-dog-sheet.component.html',
  styleUrl: './new-dog-sheet.component.scss'
})
export class NewDogSheetComponent {
  private readonly dogRepository = inject(DogRepositoryService);

  readonly close = output<void>();
  readonly created = output<string>();

  readonly id = signal('');
  readonly nombre = signal('');
  readonly raza = signal('Creuat');
  readonly edad = signal<number>(0);
  readonly energia = signal<'alta' | 'media' | 'baja'>('media');
  readonly prioridadPaseo = signal<'alta' | 'media' | 'baja'>('media');
  readonly sexo = signal<'male' | 'female' | ''>('');
  readonly color = signal('');

  readonly esPPP = signal(false);
  readonly bozalObligatorio = signal(false);
  readonly cuidadoMachos = signal(false);
  readonly cuidadoHembras = signal(false);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly notas = signal('');

  readonly canSubmit = computed(
    () =>
      this.nombre().trim().length > 0 &&
      this.raza().trim().length > 0 &&
      !this.saving()
  );

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const input: CreateDogInput = {
      id: this.id().trim() || undefined,
      nombre: this.nombre().trim(),
      raza: this.raza().trim(),
      edad: Number.isFinite(this.edad()) ? Number(this.edad()) : 0,
      energia: this.energia(),
      prioridadPaseo: this.prioridadPaseo(),
      sexo: this.sexo() || undefined,
      color: this.color().trim() || undefined,
      notas: this.notas().trim() || undefined,
      esPPP: this.esPPP(),
      bozalObligatorio: this.bozalObligatorio(),
      cuidadoMachos: this.cuidadoMachos(),
      cuidadoHembras: this.cuidadoHembras()
    };

    const result = await this.dogRepository.createDog(input);
    this.saving.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }

    this.created.emit(result.id);
    this.close.emit();
  }

  onBackdropClick(): void {
    if (this.saving()) return;
    this.close.emit();
  }

  onCloseClick(): void {
    this.close.emit();
  }
}
