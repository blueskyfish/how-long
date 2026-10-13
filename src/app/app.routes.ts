import { inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { nonBlocking, Routes } from '@angular/router';
import { of } from 'rxjs';
import { CountdownRepository } from './core/data/countdown-repository';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'How long',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
    resources: () => {
      const repository = inject(CountdownRepository);
      return {
        countdownsResource: nonBlocking(
          rxResource({
            defaultValue: [],
            stream: () => repository.watchCountdowns(),
          }),
        ),
      };
    },
  },
  {
    path: 'admin',
    pathMatch: 'full',
    title: 'Countdowns',
    loadComponent: () =>
      import('./features/admin/admin-overview-page').then((m) => m.AdminOverviewPage),
    resources: () => {
      const repository = inject(CountdownRepository);
      return {
        countdownsResource: nonBlocking(
          rxResource({
            defaultValue: [],
            stream: () => repository.watchCountdowns(),
          }),
        ),
      };
    },
  },
  {
    path: 'admin/:id',
    title: 'Countdown',
    loadComponent: () =>
      import('./features/admin/admin-detail-page').then((m) => m.AdminDetailPage),
    resources: (route) => {
      const repository = inject(CountdownRepository);
      return {
        countdownResource: nonBlocking(
          rxResource({
            params: () => route.params()['id'],
            defaultValue: undefined,
            stream: ({ params }) => {
              const id = Number(params);
              return Number.isInteger(id) ? repository.watchCountdown(id) : of(undefined);
            },
          }),
        ),
        appointmentsResource: nonBlocking(
          rxResource({
            params: () => route.params()['id'],
            defaultValue: [],
            stream: ({ params }) => {
              const id = Number(params);
              return Number.isInteger(id) ? repository.watchAppointments(id) : of([]);
            },
          }),
        ),
      };
    },
  },
  { path: '**', redirectTo: '' },
];
