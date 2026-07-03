export type DogWalkPriority = 'alta' | 'media' | 'baja';

export type DogEstado = 'activo' | 'adoptado' | 'fallecido' | 'trasladado';

export interface Dog {
  id: string;
  nombre: string;
  edad: number;
  raza: string;
  energia: 'alta' | 'media' | 'baja';
  prioridadPaseo: DogWalkPriority;
  ultimoPaseo: string;
  necesitaPaseoHoy: boolean;
  /** Ordered list of photo URLs. The first one is the primary photo. */
  fotos: string[];
  estado: DogEstado;
  notas?: string;
  /** ISO date when the dog was adopted (only meaningful if estado === 'adoptado'). */
  adoptadoEn?: string;
  sexo?: 'mascle' | 'femella';
  color?: string;
  llugarRecollida?: string;
}