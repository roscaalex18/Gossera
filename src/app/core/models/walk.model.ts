/** One recorded walk for a dog. */
export interface Walk {
  id: string;
  dogId: string;
  fecha: string;
  /** Email of the volunteer who registered the walk (looked up client-side). */
  paseadoPor?: string;
  notas?: string;
}
