import { InjectionToken, Provider } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/** DI token for the shared `SupabaseClient` instance. */
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');

/**
 * Provider factory for the Supabase client.
 * Register once at the root via `provideSupabase()` in `app.config.ts`.
 */
export function provideSupabase(): Provider {
  return {
    provide: SUPABASE_CLIENT,
    useFactory: () =>
      createClient(environment.supabase.url, environment.supabase.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: { eventsPerSecond: 5 }
        }
      })
  };
}
