import { Component, computed, effect, inject, signal } from '@angular/core';
import { Dog } from '../../core/models/dog.model';
import { CellType, ShelterRegion } from '../../core/models/shelter-map.model';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import {
  MAP_VIEWBOX_COLS,
  MAP_VIEWBOX_ROWS,
  ShelterMapService
} from '../../core/services/shelter-map.service';
import { DogCardComponent } from '../../shared/dog-card/dog-card.component';

interface PaletteOption {
  type: CellType;
  label: string;
}

/** Which panel of the bottom sheet is visible. */
type SheetMode = 'list' | 'assign';

@Component({
  selector: 'app-map-page',
  imports: [DogCardComponent],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss'
})
export class MapPageComponent {
  private readonly shelterMap = inject(ShelterMapService);
  private readonly dogRepository = inject(DogRepositoryService);

  readonly viewBoxCols = MAP_VIEWBOX_COLS;
  readonly viewBoxRows = MAP_VIEWBOX_ROWS;

  readonly regions = this.shelterMap.regions;
  readonly dogCountByRegion = this.shelterMap.dogCountByRegion;
  readonly regionByDog = this.shelterMap.regionByDog;

  readonly palette: PaletteOption[] = [
    { type: 'patio', label: 'Patio' },
    { type: 'chenil-normal', label: 'Box' },
    { type: 'chenil-solitari', label: 'Chenil solitario' },
    { type: 'chenil-varios', label: 'Chenil compartido' },
    { type: 'jaula-exterior', label: 'Jaula exterior' },
    { type: 'quarantena', label: 'Cuarentena' }
  ];

  readonly selectedRegionId = signal<string | null>(null);
  readonly sheetMode = signal<SheetMode>('list');
  readonly dogSearch = signal<string>('');

  readonly selectedRegion = computed<ShelterRegion | null>(() => {
    const id = this.selectedRegionId();
    if (!id) return null;
    return this.regions().find((r) => r.id === id) ?? null;
  });

  /** Dogs currently placed inside the selected region. */
  readonly dogsInSelected = computed<Dog[]>(() => {
    const region = this.selectedRegion();
    if (!region) return [];
    const dogIds = this.shelterMap.assignments()[region.id] ?? [];
    const dogsById = new Map(this.dogRepository.dogs().map((d) => [d.id, d]));
    return dogIds
      .map((id) => dogsById.get(id))
      .filter((d): d is Dog => !!d);
  });

  /** All dogs decorated with their current region (if any). Only active dogs. */
  readonly allDogsWithRegion = computed(() => {
    const regionsById = new Map(this.regions().map((r) => [r.id, r]));
    const dogRegion = this.regionByDog();
    return this.dogRepository
      .dogs()
      .filter((dog) => dog.estado === 'activo')
      .map((dog) => {
        const regionId = dogRegion[dog.id] ?? null;
        const region = regionId ? regionsById.get(regionId) ?? null : null;
        return {
          dog,
          currentRegionId: regionId,
          currentRegionName: region?.name ?? null
        };
      });
  });

  /** Dogs shown in the "assign" panel, filtered by search text. */
  readonly filteredDogsForAssign = computed(() => {
    const query = this.dogSearch().trim().toLowerCase();
    const rows = this.allDogsWithRegion();
    if (!query) return rows;
    return rows.filter(({ dog }) => {
      return (
        dog.nombre.toLowerCase().includes(query) ||
        dog.raza.toLowerCase().includes(query) ||
        dog.id.toLowerCase().includes(query)
      );
    });
  });

  /** Totals for the header. */
  readonly totalDogs = computed(
    () => this.dogRepository.dogs().filter((d) => d.estado === 'activo').length
  );
  readonly assignedDogs = computed(
    () => Object.keys(this.regionByDog()).length
  );

  constructor() {
    // Lock body scroll while sheet is open (nicer on mobile).
    effect((onCleanup) => {
      const isOpen = this.selectedRegion() !== null;
      if (typeof document === 'undefined') return;
      document.body.style.overflow = isOpen ? 'hidden' : '';
      onCleanup(() => {
        // Ensure scroll is restored on component destroy or effect re-run.
        document.body.style.overflow = '';
      });
    });
  }

  // === View helpers (SVG geometry) ===

  regionX(r: ShelterRegion): number {
    return r.colStart - 1;
  }
  regionY(r: ShelterRegion): number {
    return r.rowStart - 1;
  }
  regionWidth(r: ShelterRegion): number {
    return r.colEnd - r.colStart + 1;
  }
  regionHeight(r: ShelterRegion): number {
    return r.rowEnd - r.rowStart + 1;
  }
  regionCenterX(r: ShelterRegion): number {
    return (r.colStart + r.colEnd - 1) / 2;
  }
  regionCenterY(r: ShelterRegion): number {
    return (r.rowStart + r.rowEnd - 1) / 2;
  }

  /** Font size for the region label — scales down when the box is very small. */
  regionFontSize(r: ShelterRegion): number {
    const shortest = Math.min(this.regionWidth(r), this.regionHeight(r));
    return Math.max(1.4, Math.min(3, shortest * 0.6));
  }

  /** Position of the badge showing how many dogs are inside the region. */
  badgeCx(r: ShelterRegion): number {
    return r.colEnd - this.badgeRadius(r);
  }
  badgeCy(r: ShelterRegion): number {
    return r.rowStart - 1 + this.badgeRadius(r);
  }

  /** Badge circle radius adapted to the region size. */
  badgeRadius(r: ShelterRegion): number {
    const shortest = Math.min(this.regionWidth(r), this.regionHeight(r));
    return Math.max(0.55, Math.min(1.05, shortest * 0.22));
  }

  /** Badge label font-size adapted to the region size. */
  badgeFontSize(r: ShelterRegion): number {
    return this.badgeRadius(r) * 1.25;
  }

  /** Safe accessor: dogs currently assigned to `regionId` (0 if none). */
  dogCount(regionId: string): number {
    return this.dogCountByRegion()[regionId] ?? 0;
  }

  paletteLabel(type: CellType): string {
    return this.palette.find((p) => p.type === type)?.label ?? type;
  }

  // === Actions ===

  openRegion(id: string): void {
    this.selectedRegionId.set(id);
    this.sheetMode.set('list');
    this.dogSearch.set('');
  }

  closeSheet(): void {
    this.selectedRegionId.set(null);
    this.sheetMode.set('list');
    this.dogSearch.set('');
  }

  goToAssign(): void {
    this.sheetMode.set('assign');
    this.dogSearch.set('');
  }

  goToList(): void {
    this.sheetMode.set('list');
    this.dogSearch.set('');
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dogSearch.set(value);
  }

  assignDog(dogId: string): void {
    const region = this.selectedRegion();
    if (!region) return;
    this.shelterMap.assignDog(dogId, region.id);
    this.sheetMode.set('list');
    this.dogSearch.set('');
  }

  removeDog(dogId: string): void {
    const region = this.selectedRegion();
    if (!region) return;
    this.shelterMap.removeDog(dogId, region.id);
  }
}
