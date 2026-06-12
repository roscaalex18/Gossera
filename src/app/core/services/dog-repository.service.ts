import { Injectable, signal } from '@angular/core';
import { Dog } from '../models/dog.model';

const STORAGE_KEY = 'gossera.dogs.v2';

const SEED_DOGS: Dog[] = [
  {
    id: 'R-001',
    nombre: 'Nina',
    edad: 0,
    raza: 'Pitbull',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_198a518e78e8479cb7fb8144c1548f65~mv2.jpg',
    sexo: 'femella',
    color: 'Negre amb el pit blanc',
    llugarRecollida: 'Cassà de la Selva'
  },
  {
    id: 'R-004',
    nombre: 'Max',
    edad: 0,
    raza: 'American Staffordshire',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_6b7bb112aa3146c1a84a2e80f2f07c97~mv2.jpg',
    sexo: 'mascle',
    color: 'Beix i blanc',
    llugarRecollida: 'Sant Gregori'
  },
  {
    id: 'R-026',
    nombre: 'Thor',
    edad: 0,
    raza: 'Malinois',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_fb447884dbb34c8bafdc1f0ebb980ab7~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró i negre',
    llugarRecollida: 'Sarrià de Ter'
  },
  {
    id: 'R-034',
    nombre: 'Taison',
    edad: 0,
    raza: 'American Staffordshire',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_efcde19f162744da94f73d009f93ed1b~mv2.jpg',
    sexo: 'mascle',
    color: 'Negre atigrat',
    llugarRecollida: 'Cassà de la Selva'
  },
  {
    id: 'R-049',
    nombre: 'Bruno',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_85c69b964afd4cbeadd5a14b9a2a7fcd~mv2.jpg',
    sexo: 'mascle',
    color: 'Cremat i marró',
    llugarRecollida: 'Sant Gregori'
  },
  {
    id: 'R-065',
    nombre: 'Bolt',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_eee96a640c1848e1a8cabe0d58ffc6da~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró i negre',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-082',
    nombre: 'Bonito',
    edad: 0,
    raza: 'Doberman',
    energia: 'alta',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_ad85c4c5a71d45a8962c1bc53898ab3c~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró i negre'
  },
  {
    id: 'R-093',
    nombre: 'Tina',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_a419348cb78044f9bf864cf0cbde74a2~mv2.jpg',
    sexo: 'femella',
    color: 'Marró i negre',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-110',
    nombre: 'Zeus',
    edad: 0,
    raza: 'Pitbull',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_d3a334fbb6434cfca9261b36fd3ad95c~mv2.jpg',
    sexo: 'mascle',
    color: 'Atigrat blanc i marró',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-117',
    nombre: 'Lupito',
    edad: 0,
    raza: 'Pitbull',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_23562f3945be4c3096e3b03a629c00d3~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró, blanc i negre',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-118',
    nombre: 'Kaira',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_e27d58cb11454ddbbfd38ce535ae8067~mv2.jpg',
    sexo: 'femella',
    color: 'Tricolor',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-119',
    nombre: 'Canela',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_5da1516d9fad4f8fb4ec473d50724ff4~mv2.jpg',
    sexo: 'femella',
    color: 'Marró i negre',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-120',
    nombre: 'Perla',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_af543e83def44171bc077f8c3cf7a445~mv2.jpg',
    sexo: 'femella',
    color: 'Marró i negre',
    llugarRecollida: 'Llagostera'
  },
  {
    id: 'R-127',
    nombre: 'Kiro',
    edad: 0,
    raza: 'Pitbull',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_375dfda1fe484fec96b7e5e5058a57ff~mv2.jpg',
    sexo: 'mascle',
    color: 'Atigrat pit blanc'
  },
  {
    id: 'R-133',
    nombre: 'Eddye',
    edad: 2,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_99358e8730f647dab57cb08e2445fc17~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró',
    llugarRecollida: 'Celrà'
  },
  {
    id: 'R-134',
    nombre: 'Bobi',
    edad: 1,
    raza: 'Creuat',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_e8f58431a00a4c0e90a7bbde50569d69~mv2.jpg',
    sexo: 'mascle',
    color: 'Negre i blanc',
    llugarRecollida: 'Estanyol'
  },
  {
    id: 'R-143',
    nombre: 'Lucas',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_0304d00cf25a493bb5e2d2dfd6b4bea9~mv2.jpg',
    sexo: 'mascle',
    color: 'Blanc',
    llugarRecollida: 'Bescanó'
  },
  {
    id: 'R-144',
    nombre: 'Mila',
    edad: 0,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_8a909cd4d9e846f78539d9757bddcb7e~mv2.jpg',
    sexo: 'femella',
    color: 'Crema',
    llugarRecollida: 'Bescanó'
  },
  {
    id: 'R-147',
    nombre: 'Maika',
    edad: 5,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_8cdf5ef3313d41299f61231262309450~mv2.jpg',
    sexo: 'femella',
    color: 'Marró i blanc',
    llugarRecollida: 'Sant Julià de Ramis'
  },
  {
    id: 'R-148',
    nombre: 'R-148',
    edad: 10,
    raza: 'Creuat',
    energia: 'baja',
    prioridadPaseo: 'baja',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_6b73e873c13a4b26adf72ee9ed4bb782~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró',
    llugarRecollida: 'Sant Gregori'
  },
  {
    id: 'R-149',
    nombre: 'Neus',
    edad: 10,
    raza: 'Pastor alemany',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_fafe2060461b47888883a80e6fdfaf2c~mv2.jpg',
    sexo: 'femella',
    color: 'Marró i negre',
    llugarRecollida: 'Bescanó'
  },
  {
    id: 'R-151',
    nombre: 'Trina',
    edad: 0,
    raza: 'Creuat',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_c3eeb21de327432f97113efc222f6102~mv2.jpg',
    sexo: 'femella',
    color: 'Blanc i negre',
    llugarRecollida: 'Celrà'
  },
  {
    id: 'R-152',
    nombre: 'Puchi',
    edad: 0,
    raza: 'Creuat',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_62d194efec584b3499d4c009b65d7a62~mv2.jpg',
    sexo: 'mascle',
    color: 'Negre pit blanc',
    llugarRecollida: 'Sant Julià de Ramis'
  },
  {
    id: 'R-153',
    nombre: 'Ares',
    edad: 3,
    raza: 'Creuat',
    energia: 'media',
    prioridadPaseo: 'media',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_c297f466fd854f2da08b2623352c93ed~mv2.jpg',
    sexo: 'mascle',
    color: 'Marró i negre',
    llugarRecollida: 'Bescanó'
  },
  {
    id: 'R-155',
    nombre: 'Yara',
    edad: 3,
    raza: 'Border collie',
    energia: 'alta',
    prioridadPaseo: 'alta',
    ultimoPaseo: '2026-06-12T10:00:00Z',
    necesitaPaseoHoy: true,
    fotoUrl: 'https://static.wixstatic.com/media/c39690_981f9d02d47c41d2bda84a6ed8eeac61~mv2.jpg',
    sexo: 'femella',
    color: 'Negre i blanc',
    llugarRecollida: 'Sant Gregori'
  }
];

@Injectable({ providedIn: 'root' })
export class DogRepositoryService {
  readonly dogs = signal<Dog[]>(this.loadDogs());

  private loadDogs(): Dog[] {
    const fromStorage = localStorage.getItem(STORAGE_KEY);

    if (!fromStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DOGS));
      return SEED_DOGS;
    }

    try {
      return JSON.parse(fromStorage) as Dog[];
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DOGS));
      return SEED_DOGS;
    }
  }
}
