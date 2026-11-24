import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="cc-container page">
      <nav class="tabs" aria-label="Dashboard">
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inbox</a>
        <a routerLink="/dashboard/channel" routerLinkActive="active">Your channel</a>
        <a routerLink="/dashboard/account" routerLinkActive="active">Account</a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: [
    `
      .page { padding-block: var(--cc-space-6) var(--cc-space-8); }
      .tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--cc-border); margin-bottom: var(--cc-space-5); overflow-x: auto; }
      .tabs a {
        padding: 0.7rem 1rem; text-decoration: none; color: var(--cc-text-muted); font-weight: 600;
        border-bottom: 2px solid transparent; white-space: nowrap;
      }
      .tabs a.active { color: var(--cc-text); border-bottom-color: var(--cc-accent); }
    `,
  ],
})
export class DashboardLayoutComponent {}
