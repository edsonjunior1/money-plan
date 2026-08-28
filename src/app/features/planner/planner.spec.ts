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
});
