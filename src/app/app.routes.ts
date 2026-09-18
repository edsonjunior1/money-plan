import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Financial Planner | Money Plan',
    loadComponent: () => import('./features/planner/planner').then((m) => m.Planner),
  },
  {
    path: '**',
    title: 'Page not found | Money Plan',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
