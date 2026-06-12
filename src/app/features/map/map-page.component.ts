import { Component, computed, inject, signal } from '@angular/core';
import { DogRepositoryService } from '../../core/services/dog-repository.service';
import { ShelterCell, CellType } from '../../core/models/shelter-map.model';
import { Dog } from '../../core/models/dog.model';

/** Seeded pseudo-random to keep assignment stable on re-renders */
function seededShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  let seed = 42;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(seed) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Static layout definition – mirrors the satellite image */
const LAYOUT: ShelterCell[] = [
  // ── QUARANTENA (blue) – 4 compartiments esquerra + 3 dreta, enfrontats ──
  { id: 'QA1', type: 'quarantena', label: 'QA-1', capacity: 1, dogIds: [] },
  { id: 'QA2', type: 'quarantena', label: 'QA-2', capacity: 1, dogIds: [] },
  { id: 'QA3', type: 'quarantena', label: 'QA-3', capacity: 1, dogIds: [] },
  { id: 'QA4', type: 'quarantena', label: 'QA-4', capacity: 1, dogIds: [] },
  { id: 'QB1', type: 'quarantena', label: 'QB-1', capacity: 1, dogIds: [] },
  { id: 'QB2', type: 'quarantena', label: 'QB-2', capacity: 1, dogIds: [] },
  { id: 'QB3', type: 'quarantena', label: 'QB-3', capacity: 1, dogIds: [] },

  // ── JAULA EXTERIOR (rosa) ─────────────────────────────────────────────────
  { id: 'JE1', type: 'jaula-exterior', label: 'Jaula ext.', capacity: 2, dogIds: [] },

  // ── PATIOS (negre) ────────────────────────────────────────────────────────
  { id: 'P1', type: 'patio', label: 'Pati 1', capacity: 0, dogIds: [] },
  { id: 'P2', type: 'patio', label: 'Pati 2', capacity: 0, dogIds: [] },
  { id: 'P3', type: 'patio', label: 'Pati 3', capacity: 0, dogIds: [] },
  { id: 'P4', type: 'patio', label: 'Pati 4', capacity: 0, dogIds: [] },
  { id: 'P5', type: 'patio', label: 'Pati 5', capacity: 0, dogIds: [] },

  // ── CHENILS DE VARIOS (roig) – columna dreta baixant ──────────────────────
  { id: 'CV1',  type: 'chenil-varios', label: 'CV-1',  capacity: 3, dogIds: [] },
  { id: 'CV2',  type: 'chenil-varios', label: 'CV-2',  capacity: 3, dogIds: [] },
  { id: 'CV3',  type: 'chenil-varios', label: 'CV-3',  capacity: 3, dogIds: [] },
  { id: 'CV4',  type: 'chenil-varios', label: 'CV-4',  capacity: 3, accessViaPatio: true, dogIds: [] },
  { id: 'CV5',  type: 'chenil-varios', label: 'CV-5',  capacity: 3, accessViaPatio: true, dogIds: [] },
  { id: 'CV6',  type: 'chenil-varios', label: 'CV-6',  capacity: 3, dogIds: [] },
  { id: 'CV7',  type: 'chenil-varios', label: 'CV-7',  capacity: 3, dogIds: [] },
  { id: 'CV8',  type: 'chenil-varios', label: 'CV-8',  capacity: 3, dogIds: [] },
  { id: 'CV9',  type: 'chenil-varios', label: 'CV-9',  capacity: 3, dogIds: [] },
  { id: 'CV10', type: 'chenil-varios', label: 'CV-10', capacity: 3, dogIds: [] },

  // ── CHENILS SOLITARIS (groc viu) ─────────────────────────────────────────
  { id: 'CS1', type: 'chenil-solitari', label: 'Sol-1', capacity: 1, dogIds: [] },
  { id: 'CS2', type: 'chenil-solitari', label: 'Sol-2', capacity: 1, dogIds: [] },
  { id: 'CS3', type: 'chenil-solitari', label: 'Sol-3', capacity: 1, dogIds: [] },
  { id: 'CS4', type: 'chenil-solitari', label: 'Sol-4', capacity: 1, dogIds: [] },
  { id: 'CS5', type: 'chenil-solitari', label: 'Sol-5', capacity: 1, dogIds: [] },

  // ── CHENILS NORMALS (beix) ────────────────────────────────────────────────
  { id: 'CN1', type: 'chenil-normal', label: 'Nor-1', capacity: 1, dogIds: [] },
  { id: 'CN2', type: 'chenil-normal', label: 'Nor-2', capacity: 1, dogIds: [] },
  { id: 'CN3', type: 'chenil-normal', label: 'Nor-3', capacity: 1, dogIds: [] },
];

function assignDogsRandomly(dogs: Dog[], layout: ShelterCell[]): ShelterCell[] {
  const cells: ShelterCell[] = layout.map(c => ({ ...c, dogIds: [] }));
  const shuffled = seededShuffle(dogs.map(d => d.id));
  let idx = 0;
  for (const cell of cells) {
    if (cell.type === 'patio' || cell.capacity === 0) continue;
    const slots = cell.id === 'Q1' ? 8 : cell.capacity;
    for (let s = 0; s < slots && idx < shuffled.length; s++, idx++) {
      cell.dogIds.push(shuffled[idx]);
    }
  }
  return cells;
}

const CELL_COLORS: Record<CellType, string> = {
  'patio':           '#3a3a3a',
  'chenil-varios':   '#e53e3e',
  'chenil-solitari': '#d4a017',
  'chenil-normal':   '#c8b06a',
  'jaula-exterior':  '#d4498a',
  'quarantena':      '#3b82f6',
};

export interface CellRect {
  cell: ShelterCell;
  x: number;
  y: number;
  w: number;
  h: number;
  subRects?: { x: number; y: number; w: number; h: number }[];
}

/** Pre-computes pixel positions for each cell, mirroring the satellite image.
 *
 * ViewBox: 520 × 780  (portrait, north-up)
 *
 * Layout reading (photo, top→bottom):
 *  TOP-RIGHT  : Quarantena – 4 caixes amunt (QA1-4) + 3 caixes avall (QB1-3), enfrontades, corredor entremig
 *  TOP-CENTER : Edifici gris (decoratiu) + jaula exterior rosa al costat
 *  COLUMNA DRETA (vertical): 10 chenils de varios (roig), apilats, baixant en diagonal cap a baix-centre
 *  COLUMNA ESQUERRA: 5 patios grans (negre), baixant amb esglaó diagonal
 *  CENTRE: chenils normals (beix) i solitaris (groc), intercalats, baixant
 *  BAIX ESQUERRA: més chenils solitaris (groc viu)
 */
function buildCellRects(cells: ShelterCell[]): CellRect[] {
  const map = new Map(cells.map(c => [c.id, c]));
  const rects: CellRect[] = [];
  const S = 38; // standard cell size

  const add = (id: string, x: number, y: number, w = S, h = S, subs?: { x: number; y: number; w: number; h: number }[]) => {
    const cell = map.get(id);
    if (cell) rects.push({ cell, x, y, w, h, subRects: subs });
  };

  // ─── QUARANTENA ───────────────────────────────────────────────────────────
  // Fila A: 4 caixes horitzontals (top), fila B: 3 caixes (bottom), corredor 12px
  const qx = 310, qy = 30;
  add('QA1', qx,        qy,       S, S);
  add('QA2', qx + S,    qy,       S, S);
  add('QA3', qx + S*2,  qy,       S, S);
  add('QA4', qx + S*3,  qy,       S, S);
  // fila B enfrontada (corredor 12px)
  add('QB1', qx,        qy+S+12,  S, S);
  add('QB2', qx + S,    qy+S+12,  S, S);
  add('QB3', qx + S*2,  qy+S+12,  S, S);

  // ─── JAULA EXTERIOR (rosa) ────────────────────────────────────────────────
  add('JE1', 228, 118, S+10, S);

  // ─── PATIOS (negre) – baixant en diagonal, esquerra del camí ──────────────
  const pw = 62, ph = 62;
  add('P1', 18,  148, pw, ph);
  add('P2', 28,  234, pw, ph);
  add('P3', 18,  328, pw, ph);
  add('P4', 36,  422, pw, ph);
  add('P5', 24,  524, pw, ph);

  // ─── CHENILS DE VARIOS (roig) – columna dreta, baixant i desplaçant-se ────
  const cvStartX = 360, cvStartY = 148;
  add('CV1',  cvStartX,      cvStartY,          S, S);
  add('CV2',  cvStartX,      cvStartY +  S,     S, S);
  add('CV3',  cvStartX,      cvStartY + S*2,    S, S);
  add('CV4',  cvStartX,      cvStartY + S*3,    S, S);
  add('CV5',  cvStartX,      cvStartY + S*4,    S, S);
  add('CV6',  cvStartX-12,   cvStartY + S*5,    S, S);
  add('CV7',  cvStartX-12,   cvStartY + S*6,    S, S);
  add('CV8',  cvStartX-24,   cvStartY + S*7,    S, S);
  add('CV9',  cvStartX-24,   cvStartY + S*8,    S, S);
  add('CV10', cvStartX-36,   cvStartY + S*9,    S, S);

  // ─── CHENILS NORMALS (beix) – columna centre, a la dreta dels patios ──────
  const cnx = 140;
  add('CN1', cnx, 240, S, S);
  add('CN2', cnx, 334, S, S);
  add('CN3', cnx, 428, S, S);

  // ─── CHENILS SOLITARIS (groc viu) – baixant en diagonal ──────────────────
  add('CS1', 112, 486, S, S);
  add('CS2', 114, 556, S, S);
  add('CS3', 150, 612, S, S);
  add('CS4', 192, 660, S, S);
  add('CS5', 234, 700, S, S);

  return rects;
}

@Component({
  selector: 'app-map-page',
  imports: [],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss'
})
export class MapPageComponent {
  private readonly repo = inject(DogRepositoryService);

  readonly cells = computed(() => assignDogsRandomly(this.repo.dogs(), LAYOUT));

  readonly cellRects = computed(() => buildCellRects(this.cells()));

  readonly selectedCell = signal<ShelterCell | null>(null);

  readonly dogMap = computed(() => {
    const map = new Map<string, Dog>();
    for (const dog of this.repo.dogs()) map.set(dog.id, dog);
    return map;
  });

  selectCell(cell: ShelterCell): void {
    if (cell.type === 'patio') return;
    this.selectedCell.set(
      this.selectedCell()?.id === cell.id ? null : cell
    );
  }

  dogOf(id: string): Dog | undefined {
    return this.dogMap().get(id);
  }

  colorOf(type: CellType): string {
    return CELL_COLORS[type];
  }

  closePanel(): void {
    this.selectedCell.set(null);
  }

  shortName(name: string): string {
    return name.length > 6 ? name.slice(0, 6) : name;
  }

  readonly legend: { type: CellType; label: string }[] = [
    { type: 'patio',           label: 'Pati' },
    { type: 'chenil-varios',   label: 'Chenil de varios' },
    { type: 'chenil-solitari', label: 'Chenil solitari' },
    { type: 'chenil-normal',   label: 'Chenil normal' },
    { type: 'jaula-exterior',  label: 'Jaula exterior' },
    { type: 'quarantena',      label: 'Quarantena' },
  ];
}
