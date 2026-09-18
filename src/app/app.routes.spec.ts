import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

registerLocaleData(localePt);

describe('App routes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });
  afterEach(() => localStorage.clear());

  it('keeps both routes lazy and the wildcard last', () => {
    expect(routes.map((route) => route.path)).toEqual(['', '**']);
    for (const route of routes) {
      expect(route.loadComponent).toBeTypeOf('function');
      expect(route.component).toBeUndefined();
    }
  });

  it('opens the planner at / with its title and focused heading', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    const heading = harness.routeNativeElement!.querySelector('h1')!;
    expect(heading.textContent).toBe('Financial Plan');
    expect(TestBed.inject(Title).getTitle()).toBe('Financial Planner | Money Plan');
    expect(document.activeElement).toBe(heading);
  });

  it.each(['/missing', '/missing/nested/path'])(
    'handles %s and returns through the planner link',
    async (path) => {
      const harness = await RouterTestingHarness.create('/');
      await harness.navigateByUrl(path);
      await harness.fixture.whenStable();
      const heading = harness.routeNativeElement!.querySelector('h1')!;
      expect(heading.textContent).toBe('Page not found');
      expect(TestBed.inject(Router).url).toBe(path);
      expect(TestBed.inject(Title).getTitle()).toBe('Page not found | Money Plan');
      expect(document.activeElement).toBe(heading);
      const link = harness.routeNativeElement!.querySelector('a')!;
      expect(link.textContent?.trim()).toBe('Back to planner');
      expect(link.getAttribute('href')).toBe('/');
      link.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/');
      expect(TestBed.inject(Title).getTitle()).toBe('Financial Planner | Money Plan');
      const plannerHeading = harness.routeNativeElement!.querySelector('h1')!;
      expect(plannerHeading.textContent).toBe('Financial Plan');
      expect(document.activeElement).toBe(plannerHeading);
    },
  );
});
