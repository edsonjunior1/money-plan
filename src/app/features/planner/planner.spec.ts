import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Planner } from './planner';

registerLocaleData(localePt);

describe('Planner', () => {
  let component: Planner;
  let fixture: ComponentFixture<Planner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Planner],
    }).compileComponents();

    fixture = TestBed.createComponent(Planner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the default planner values', () => {
    expect(component.model()).toEqual({
      currentAmount: 0,
      targetAmount: 100_000,
      years: 5,
      annualReturnRate: 10,
      plannedMonthlyContribution: 1_500,
    });
  });

  it('should calculate the required monthly contribution', () => {
    expect(component.requiredMonthlyContribution()).toBeGreaterThan(0);
  });

  it('should recalculate when the form model changes', () => {
    const initialContribution = component.requiredMonthlyContribution();

    component.model.update((model) => ({
      ...model,
      targetAmount: 200_000,
    }));

    expect(component.requiredMonthlyContribution()).toBeGreaterThan(initialContribution);
  });

  it('should identify when the planned contribution is enough', () => {
    component.model.update((model) => ({
      ...model,
      plannedMonthlyContribution: 10_000,
    }));

    expect(component.isOnTrack()).toBe(true);
    expect(component.monthlyDifference()).toBeGreaterThanOrEqual(0);
  });

  it('should identify when the planned contribution is not enough', () => {
    component.model.update((model) => ({
      ...model,
      plannedMonthlyContribution: 100,
    }));

    expect(component.isOnTrack()).toBe(false);
    expect(component.monthlyDifference()).toBeLessThan(0);
  });

  it('should project a higher final amount when the planned contribution increases', () => {
    const initialFutureValue = component.plannedFutureValue();

    component.model.update((model) => ({
      ...model,
      plannedMonthlyContribution: 3_000,
    }));

    expect(component.plannedFutureValue()).toBeGreaterThan(initialFutureValue);
  });

  it('should generate an investment timeline from the planner model', () => {
    const timeline = component.investmentTimeline();

    expect(timeline).toHaveLength(component.model().years + 1);

    expect(timeline[0].year).toBe(0);

    expect(timeline[timeline.length - 1].investmentValue).toBeCloseTo(
      component.plannedFutureValue(),
      2,
    );
  });

  it('shows planned totals throughout the page and PDF independently of the target', async () => {
    component.model.set({
      currentAmount: 10_000,
      targetAmount: 100_000,
      years: 1,
      annualReturnRate: 0,
      plannedMonthlyContribution: 1_000,
    });
    await fixture.whenStable();

    expect(component.totalContributed()).toBe(22_000);
    expect(component.plannedFutureValue()).toBe(22_000);
    expect(component.estimatedReturns()).toBe(0);
    expect(component.requiredMonthlyContribution()).toBe(7_500);
    expect(component.monthlyDifference()).toBe(-6_500);

    const root = fixture.nativeElement as HTMLElement;
    const summaries = [...root.querySelectorAll('mat-card'), root.querySelector('.pdf-report')!];
    for (const summary of summaries) {
      const text = summary.textContent!.replace(/\s+/g, ' ');
      expect(text).toMatch(/Total contributed\s+R\$\s*22\.000,00/);
      expect(text).toMatch(/Estimated [Rr]eturns\s+R\$\s*0,00/);
      expect(text).toMatch(/(?:Projected final amount|Projected Amount)\s+R\$\s*22\.000,00/);
    }

    component.model.update((value) => ({ ...value, targetAmount: 10_000 }));
    expect(component.totalContributed()).toBe(22_000);
    expect(component.plannedFutureValue()).toBe(22_000);
    expect(component.estimatedReturns()).toBe(0);
    expect(component.requiredMonthlyContribution()).toBe(0);
    expect(component.monthlyDifference()).toBe(1_000);
  });

  it('calculates returns from the planned final value for fractional years', () => {
    component.model.update((value) => ({ ...value, years: 1.5 }));
    expect(component.totalContributed()).toBe(27_000);
    expect(component.estimatedReturns()).toBe(component.plannedFutureValue() - 27_000);
  });
});
