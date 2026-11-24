import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brand } from '@creatorconnect/shared';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="cc-container grid">
        <div class="col">
          <div class="brand"><span aria-hidden="true">◆</span> {{ brandName }}</div>
          <p class="cc-subtle">{{ tagline }}</p>
        </div>
        <nav class="col" aria-label="Product">
          <h3>Product</h3>
          <a routerLink="/directory">Find Creators</a>
          <a routerLink="/list-your-channel">List Your Channel</a>
        </nav>
        <nav class="col" aria-label="Company">
          <h3>Support</h3>
          <a routerLink="/help">Help</a>
          <a routerLink="/contact">Contact</a>
        </nav>
        <nav class="col" aria-label="Legal">
          <h3>Legal</h3>
          <a routerLink="/privacy">Privacy</a>
          <a routerLink="/terms">Terms</a>
        </nav>
      </div>
      <div class="cc-container bottom">
        <span class="cc-subtle">© {{ year }} {{ brandName }}. A demo marketplace.</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .site-footer {
        margin-top: var(--cc-space-8);
        border-top: 1px solid var(--cc-border);
        background: var(--cc-surface-subtle);
        padding-block: var(--cc-space-7) var(--cc-space-5);
      }
      .grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: var(--cc-space-6);
      }
      @media (max-width: 720px) {
        .grid { grid-template-columns: 1fr 1fr; }
      }
      .col { display: flex; flex-direction: column; gap: 0.5rem; }
      .col h3 { font-size: var(--cc-text-sm); text-transform: uppercase; letter-spacing: 0.06em; color: var(--cc-text-muted); margin: 0 0 0.25rem; }
      .col a { color: var(--cc-text); text-decoration: none; font-size: var(--cc-text-sm); }
      .col a:hover { color: var(--cc-accent-ink); text-decoration: underline; }
      .brand { font-weight: 800; }
      .brand span { color: var(--cc-accent); }
      .bottom { margin-top: var(--cc-space-6); font-size: var(--cc-text-sm); }
    `,
  ],
})
export class FooterComponent {
  readonly brandName = brand.name;
  readonly tagline = brand.tagline;
  readonly year = new Date().getFullYear();
}
