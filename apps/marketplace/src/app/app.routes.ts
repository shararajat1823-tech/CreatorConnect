import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Find YouTube creators for your next campaign',
  },
  {
    path: 'directory',
    loadComponent: () =>
      import('./features/directory/directory.component').then((m) => m.DirectoryComponent),
  },
  {
    path: 'creators/:slug',
    loadComponent: () =>
      import('./features/profile/creator-profile.component').then((m) => m.CreatorProfileComponent),
  },
  {
    path: 'list-your-channel',
    loadComponent: () =>
      import('./features/list-channel/list-channel.component').then((m) => m.ListChannelComponent),
    title: 'List your channel',
  },

  // --- Auth ---
  {
    path: 'auth/sign-in',
    loadComponent: () => import('./features/auth/sign-in.component').then((m) => m.SignInComponent),
    title: 'Sign in',
  },
  {
    path: 'auth/sign-up',
    loadComponent: () => import('./features/auth/sign-up.component').then((m) => m.SignUpComponent),
    title: 'Create an account',
  },
  {
    path: 'auth/confirm',
    loadComponent: () => import('./features/auth/confirm.component').then((m) => m.ConfirmComponent),
    title: 'Confirm your email',
  },
  {
    path: 'auth/reset',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
    title: 'Reset your password',
  },
  {
    path: 'auth/update-password',
    loadComponent: () =>
      import('./features/auth/update-password.component').then((m) => m.UpdatePasswordComponent),
    title: 'Set a new password',
  },

  // --- Member dashboard (requires sign-in) ---
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/inbox.component').then((m) => m.InboxComponent),
        title: 'Your requests',
      },
      {
        path: 'channel',
        loadComponent: () =>
          import('./features/dashboard/channel-editor.component').then((m) => m.ChannelEditorComponent),
        title: 'Your channel',
      },
      {
        path: 'requests/:id',
        loadComponent: () =>
          import('./features/dashboard/thread.component').then((m) => m.ThreadComponent),
        title: 'Conversation',
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./features/dashboard/account.component').then((m) => m.AccountComponent),
        title: 'Account',
      },
    ],
  },

  // --- Static pages ---
  {
    path: 'help',
    loadComponent: () => import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'help' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'contact' },
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'privacy' },
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/static/static-page.component').then((m) => m.StaticPageComponent),
    data: { page: 'terms' },
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/static/not-found.component').then((m) => m.NotFoundComponent),
  },
];
