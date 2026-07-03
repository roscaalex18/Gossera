export type CellType =
  | 'patio'          // dark   – open yard
  | 'chenil-varios'  // red    – multi-dog kennel (some accessible only through patio)
  | 'chenil-solitari' // yellow – single-dog kennel
  | 'chenil-normal'  // beige  – standard kennel
  | 'jaula-exterior' // pink   – outdoor cage on ground
  | 'quarantena';    // blue   – quarantine block

/**
 * A rectangular zone on the shelter map.
 * Coordinates are 1-based inclusive bounds relative to the underlying
 * grid (used as the SVG viewBox).
 */
export interface ShelterRegion {
  id: string;
  name: string;
  type: CellType;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

/** Map from region id -> ordered list of dog ids currently assigned. */
export type ShelterAssignments = Record<string, string[]>;
