import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'How long',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'admin',
    pathMatch: 'full',
    title: 'Countdowns',
    loadComponent: () =>
      import('./features/admin/admin-overview-page').then((m) => m.AdminOverviewPage),
  },
  {
    path: 'admin/:id',
    title: 'Countdown',
    loadComponent: () =>
      import('./features/admin/admin-detail-page').then((m) => m.AdminDetailPage),
  },
  { path: '**', redirectTo: '' },
];
