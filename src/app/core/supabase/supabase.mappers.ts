import { Dog, DogEstado } from '../models/dog.model';

/**
 * Postgres uses snake_case, our domain model uses camelCase.
 * These mappers convert between the two representations.
 */

export interface DogRow {
  id: string;
  nombre: string;
  edad: number;
  raza: string;
  energia: 'alta' | 'media' | 'baja';
  prioridad_paseo: 'alta' | 'media' | 'baja';
  ultimo_paseo: string;
  necesita_paseo_hoy: boolean;
  fotos: string[] | null;
  estado: DogEstado | null;
  notas: string | null;
  adoptado_en: string | null;
  sexo: 'male' | 'female' | null;
  color: string | null;
  es_ppp: boolean | null;
  bozal_obligatorio: boolean | null;
  cuidado_machos: boolean | null;
  cuidado_hembras: boolean | null;
}

export function rowToDog(row: DogRow): Dog {
  return {
    id: row.id,
    nombre: row.nombre,
    edad: row.edad,
    raza: row.raza,
    energia: row.energia,
    prioridadPaseo: row.prioridad_paseo,
    ultimoPaseo: row.ultimo_paseo,
    necesitaPaseoHoy: row.necesita_paseo_hoy,
    fotos: row.fotos ?? [],
    estado: row.estado ?? 'activo',
    notas: row.notas ?? undefined,
    adoptadoEn: row.adoptado_en ?? undefined,
    sexo: row.sexo ?? undefined,
    color: row.color ?? undefined,
    esPPP: row.es_ppp ?? false,
    bozalObligatorio: row.bozal_obligatorio ?? false,
    cuidadoMachos: row.cuidado_machos ?? false,
    cuidadoHembras: row.cuidado_hembras ?? false
  };
}

export function dogToRow(dog: Dog): DogRow {
  return {
    id: dog.id,
    nombre: dog.nombre,
    edad: dog.edad,
    raza: dog.raza,
    energia: dog.energia,
    prioridad_paseo: dog.prioridadPaseo,
    ultimo_paseo: dog.ultimoPaseo,
    necesita_paseo_hoy: dog.necesitaPaseoHoy,
    fotos: dog.fotos ?? [],
    estado: dog.estado ?? 'activo',
    notas: dog.notas ?? null,
    adoptado_en: dog.adoptadoEn ?? null,
    sexo: dog.sexo ?? null,
    color: dog.color ?? null,
    es_ppp: dog.esPPP,
    bozal_obligatorio: dog.bozalObligatorio,
    cuidado_machos: dog.cuidadoMachos,
    cuidado_hembras: dog.cuidadoHembras
  };
}
