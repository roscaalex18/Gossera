import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ActivityLogService } from './core/services/activity-log.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly activityLog = inject(ActivityLogService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    // Loggeamos ANTES de signOut para que el JWT siga vivo y el registro
    // se inserte con el email/id del usuario correctos.
    this.activityLog.log({
      action: 'auth.logout',
      entityType: 'auth',
      summary: 'Cerró sesión'
    });
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
