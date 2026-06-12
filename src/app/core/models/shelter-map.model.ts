export type CellType =
  | 'patio'          // black  – open yard
  | 'chenil-varios'  // red    – multi-dog kennel (some accessible only through patio)
  | 'chenil-solitari' // yellow – single-dog kennel
  | 'chenil-normal'  // beige  – standard kennel
  | 'jaula-exterior' // pink   – outdoor cage on ground
  | 'quarantena';    // blue   – quarantine block (8 compartments)

export interface ShelterCell {
  id: string;
  type: CellType;
  label: string;
  /** For quarantena cells, how many compartments (default 1 for others) */
  capacity: number;
  /** True if access requires going through a patio first */
  accessViaPatio?: boolean;
  /** Dog IDs currently assigned to this cell */
  dogIds: string[];
}
