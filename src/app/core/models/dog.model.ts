export type DogWalkPriority = 'alta' | 'media' | 'baja';

export type DogEstado = 'activo' | 'adoptado' | 'fallecido' | 'trasladado';

export interface Dog {
  /** Internal primary key (auto-generated, never shown to the user). */
  id: string;
  /**
   * Código externo (p.ej. de la ficha del ayuntamiento). Opcional: se rellena
   * cuando se conoce, si es que se conoce alguna vez. Sirve para cruzar con
   * registros externos aunque los nombres del perro sean distintos.
   */
  codigo?: string;
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
  /**
   * Marca de "prioridad máxima" (destacar / fijar arriba). Ortogonal a
   * `prioridadPaseo`: cuando está activo, el perro aparece siempre al
   * principio del listado sin importar su prioridad habitual.
   */
  destacado: boolean;
}