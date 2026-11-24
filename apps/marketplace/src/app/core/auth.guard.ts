import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/**
 * Requires a signed-in user. On the server it allows rendering a shell (the
 * real check happens after hydration). Unauthenticated browser users are sent
 * to sign-in with a `redirect` back to where they were going.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const supa = inject(SupabaseService);
  if (!supa.isBrowser) return true;

  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady;
  if (auth.isSignedIn()) return true;
  return router.createUrlTree(['/auth/sign-in'], { queryParams: { redirect: state.url } });
};
