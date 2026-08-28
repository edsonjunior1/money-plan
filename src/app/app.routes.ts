import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/planner/planner').then((m) => m.Planner),
  },
];
