import { Routes } from '@angular/router';
import { DogsPageComponent } from './features/dogs/dogs-page.component';
import { MapPageComponent } from './features/map/map-page.component';
import { WalksPageComponent } from './features/walks/walks-page.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'perros' },
	{ path: 'perros', component: DogsPageComponent },
	{ path: 'mapa', component: MapPageComponent },
	{ path: 'paseos', component: WalksPageComponent },
	{ path: '**', redirectTo: 'perros' }
];
