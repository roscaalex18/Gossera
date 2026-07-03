import { computed, inject, Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';

export type SignInResult = { ok: true } | { ok: false; message: string };

/** Domain used to fake emails when the user logs in with just a username. */
export const USERNAME_DOMAIN = 'gmail.com';

/**
 * Wraps Supabase Auth as reactive signals.
 *
 * - `session()` / `user()` update automatically on login/logout/token refresh.
 * - `restore()` is called once at app startup (via provideAppInitializer)
 *   so guards can safely read the current session synchronously.
 * - Users log in with a plain username: `pepe` → `pepe@gmail.com` under
 *   the hood. Real emails also work if entered with `@`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  readonly session = signal<Session | null>(null);
  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  /** Human-friendly label: hides the `@gmail.com` suffix for pretty display. */
  readonly displayName = computed(() => this.formatEmail(this.user()?.email));

  private restored = false;

  /**
   * Load any persisted session from local storage and subscribe to
   * subsequent auth state changes. Idempotent.
   */
  async restore(): Promise<void> {
    if (this.restored) return;
    this.restored = true;

    const { data } = await this.supabase.auth.getSession();
    this.session.set(data.session);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  async signIn(identifier: string, password: string): Promise<SignInResult> {
    const email = normalizeIdentifier(identifier);
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) return { ok: false, message: error.message };
    this.session.set(data.session);
    return { ok: true };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.session.set(null);
  }

  /**
   * Turn a stored email into what the UI should show:
   * - `pepe@gossera.local` → `pepe`
   * - `pepe@refugio.org`   → `pepe@refugio.org` (unchanged, real email)
   */
  formatEmail(email: string | null | undefined): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    return domain === USERNAME_DOMAIN ? local : email;
  }
}

/** Accept either a bare username or a full email. */
function normalizeIdentifier(input: string): string {
  const trimmed = input.trim();
  return trimmed.includes('@') ? trimmed : `${trimmed}@${USERNAME_DOMAIN}`;
}
