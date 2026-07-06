import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Restringe rutas a usuarios con role 'admin' en su JWT
 * (`raw_app_meta_data.role = 'admin'`).
 *
 *  - Sin sesión         → redirige a `/login` conservando `returnUrl`.
 *  - Sesión no-admin    → redirige a `/perros` (fallback seguro).
 *  - Sesión admin       → permite el acceso.
 *
 * Se apoya en el JWT, así que si acabas de cambiar el rol en Supabase el
 * usuario tiene que cerrar sesión y volver a entrar para que el nuevo
 * claim aparezca en `user.app_metadata`.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (!auth.isAdmin()) {
    return router.createUrlTree(['/perros']);
  }

  return true;
};
