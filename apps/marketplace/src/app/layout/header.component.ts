import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { brand } from '@creatorconnect/shared';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="cc-container bar">
        <a class="brand" routerLink="/" [attr.aria-label]="brandName + ' home'">
          <span class="brand-mark" aria-hidden="true">◆</span>
          <span class="brand-name">{{ brandName }}</span>
        </a>

        <button
          class="menu-toggle"
          type="button"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="primary-nav"
          (click)="menuOpen.set(!menuOpen())"
        >
          <span class="cc-sr-only">Menu</span>
          <span class="menu-icon" aria-hidden="true">{{ menuOpen() ? '✕' : '☰' }}</span>
        </button>

        <nav id="primary-nav" class="nav" [class.open]="menuOpen()" aria-label="Primary">
          <a routerLink="/directory" routerLinkActive="active" (click)="close()">Find Creators</a>
          <a routerLink="/list-your-channel" routerLinkActive="active" (click)="close()">
            List Your Channel
          </a>
          <a routerLink="/help" routerLinkActive="active" (click)="close()">Resources</a>

          @if (auth.isSignedIn()) {
            <a routerLink="/dashboard" routerLinkActive="active" (click)="close()">Dashboard</a>
            <button class="cc-btn cc-btn--secondary cc-btn--sm" type="button" (click)="signOut()">
              Sign out
            </button>
          } @else {
            <a routerLink="/auth/sign-in" (click)="close()">Sign in</a>
            <a class="cc-btn cc-btn--primary cc-btn--sm" routerLink="/auth/sign-up" (click)="close()">
              Create account
            </a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      .site-header {
        position: sticky;
        top: 0;
        z-index: 40;
        background: color-mix(in srgb, var(--cc-bg) 88%, transparent);
        backdrop-filter: saturate(140%) blur(8px);
        border-bottom: 1px solid var(--cc-border);
      }
      .bar {
        display: flex;
        align-items: center;
        gap: var(--cc-space-4);
        min-height: 64px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 800;
        text-decoration: none;
        color: var(--cc-text);
        margin-right: auto;
      }
      .brand-mark { color: var(--cc-accent); font-size: 1.1rem; }
      .brand-name { letter-spacing: -0.02em; font-size: 1.1rem; }
      .nav {
        display: flex;
        align-items: center;
        gap: var(--cc-space-4);
      }
      .nav a {
        text-decoration: none;
        color: var(--cc-text);
        font-weight: 600;
        font-size: var(--cc-text-sm);
      }
      .nav a.active { color: var(--cc-accent-ink); }
      .nav a.cc-btn { color: var(--cc-text-on-accent); }
      .menu-toggle {
        display: none;
        background: transparent;
        border: 1px solid var(--cc-border-strong);
        border-radius: var(--cc-radius-md);
        padding: 0.4rem 0.6rem;
        font-size: 1.1rem;
        cursor: pointer;
      }
      @media (max-width: 820px) {
        .menu-toggle { display: inline-flex; }
        .nav {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          flex-direction: column;
          align-items: stretch;
          gap: var(--cc-space-2);
          padding: var(--cc-space-4);
          background: var(--cc-surface);
          border-bottom: 1px solid var(--cc-border);
          box-shadow: var(--cc-shadow-md);
          display: none;
        }
        .nav.open { display: flex; }
        .nav a, .nav button { width: 100%; }
        .nav a:not(.cc-btn) { padding: 0.6rem 0; }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly brandName = brand.name;
  readonly menuOpen = signal(false);

  close(): void {
    this.menuOpen.set(false);
  }

  async signOut(): Promise<void> {
    this.close();
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
