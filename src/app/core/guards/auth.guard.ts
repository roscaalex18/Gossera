import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks navigation when there is no active Supabase session and
 * redirects to `/login`, preserving the intended URL as `returnUrl`.
 * Session restoration happens in provideAppInitializer, so by the time
 * this guard runs the signal already reflects the persisted session.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
