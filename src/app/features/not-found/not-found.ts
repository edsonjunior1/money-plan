import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeading } from '../../shared/page-heading';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, PageHeading],
  template: `
    <main class="mx-auto max-w-5xl bg-white p-6">
      <h1 appPageHeading class="text-3xl font-semibold">Page not found</h1>
      <p class="mt-2 mb-6 text-sm text-gray-600">The page you requested could not be found.</p>
      <a matButton="filled" routerLink="/">Back to planner</a>
    </main>
  `,
})
export class NotFound {}
