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
  sexo?: 'male' | 'female';
  color?: string;
  /** Marcado manualmente como Perro Potencialmente Peligroso. */
  esPPP: boolean;
  /** Obligatorio pasearlo con bozal. */
  bozalObligatorio: boolean;
  /** Precaución al cruzarse con otros machos. */
  cuidadoMachos: boolean;
  /** Precaución al cruzarse con otras hembras. */
  cuidadoHembras: boolean;
}