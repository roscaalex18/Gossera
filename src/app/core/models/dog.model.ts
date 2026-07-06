export type DogWalkPriority = 'alta' | 'media' | 'baja';

export type DogEstado = 'activo' | 'adoptado' | 'fallecido' | 'trasladado';

/**
 * Intervalo objetivo entre paseos según la prioridad del perro. Si pasan
 * más días de este intervalo desde el último paseo, el perro se considera
 * "pendiente" y sube en el orden del listado.
 *
 * - alta:  cada 4 días (ideal 2 paseos/semana)
 * - media: cada 7 días (1 paseo/semana)
 * - baja:  cada 14 días (1 paseo cada 2 semanas)
 */
export const WALK_INTERVAL_DAYS: Record<DogWalkPriority, number> = {
  alta: 4,
  media: 7,
  baja: 14
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Días transcurridos desde el último paseo (puede ser fracción). */
export function daysSinceLastWalk(dog: Dog, now: number = Date.now()): number {
  const last = new Date(dog.ultimoPaseo).getTime();
  return (now - last) / DAY_MS;
}

/**
 * Ratio "días transcurridos / intervalo objetivo".
 *  - < 1  → el perro está al día.
 *  - = 1  → justo toca hoy.
 *  - > 1  → retraso (perro pendiente). Cuanto mayor, más urgente.
 * Se usa como clave de ordenación en el listado principal.
 */
export function walkUrgencyScore(dog: Dog, now: number = Date.now()): number {
  return daysSinceLastWalk(dog, now) / WALK_INTERVAL_DAYS[dog.prioridadPaseo];
}

/** `true` si al perro ya le tocaba paseo (o va con retraso). */
export function isWalkOverdue(dog: Dog, now: number = Date.now()): boolean {
  return walkUrgencyScore(dog, now) >= 1;
}

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