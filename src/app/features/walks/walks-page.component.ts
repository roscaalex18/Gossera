import { Component } from '@angular/core';

@Component({
  selector: 'app-walks-page',
  template: `
    <section class="placeholder-page">
      <h1>Seguimiento de paseos</h1>
      <p>
        Aqui mostraremos los ultimos perros paseados y los que necesitan paseo urgente.
      </p>
    </section>
  `,
  styles: `
    .placeholder-page {
      background: #fff;
      border: 1px solid #d7e1ef;
      border-radius: 14px;
      padding: 1rem;
    }

    h1 {
      margin-top: 0;
    }
  `
})
export class WalksPageComponent {}
