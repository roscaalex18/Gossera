import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly username = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly canSubmit = computed(
    () =>
      this.username().trim().length > 0 &&
      this.password().length > 0 &&
      !this.loading()
  );

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.loading.set(true);
    this.error.set(null);

    const result = await this.auth.signIn(this.username(), this.password());

    this.loading.set(false);

    if (!result.ok) {
      this.error.set(this.friendlyError(result.message));
      return;
    }

    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/perros';
    await this.router.navigateByUrl(returnUrl);
  }

  private friendlyError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('invalid login')) return 'Usuario o contraseña incorrectos.';
    if (m.includes('email not confirmed')) return 'Debes confirmar tu cuenta antes de entrar.';
    return message || 'No se pudo iniciar sesión.';
  }
}
