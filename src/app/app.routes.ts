import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { ActivityPageComponent } from './features/activity/activity-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { DogsPageComponent } from './features/dogs/dogs-page.component';
import { MapPageComponent } from './features/map/map-page.component';
import { WalksPageComponent } from './features/walks/walks-page.component';

export const routes: Routes = [
	{ path: 'login', component: LoginPageComponent },
	{ path: '', pathMatch: 'full', redirectTo: 'perros' },
	{ path: 'perros', component: DogsPageComponent, canActivate: [authGuard] },
	{ path: 'mapa', component: MapPageComponent, canActivate: [authGuard] },
	{ path: 'paseos', component: WalksPageComponent, canActivate: [authGuard] },
	{ path: 'actividad', component: ActivityPageComponent, canActivate: [adminGuard] },
	{ path: '**', redirectTo: 'perros' }
];
