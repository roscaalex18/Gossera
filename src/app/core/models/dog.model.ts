export type DogWalkPriority = 'alta' | 'media' | 'baja';

export interface Dog {
  id: string;
  nombre: string;
  edad: number;
  raza: string;
  energia: 'alta' | 'media' | 'baja';
  prioridadPaseo: DogWalkPriority;
  ultimoPaseo: string;
  necesitaPaseoHoy: boolean;
  fotoUrl: string;
  sexo?: 'mascle' | 'femella';
  color?: string;
  llugarRecollida?: string;
}