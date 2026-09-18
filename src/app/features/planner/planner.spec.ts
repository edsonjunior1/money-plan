import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Planner } from './planner';
import { DEFAULT_PLANNER_INPUTS } from './planner-inputs';

registerLocaleData(localePt);

describe('Planner', () => {
  let component: Planner;
  let fixture: ComponentFixture<Planner>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Planner],
    }).compileComponents();

    fixture = TestBed.createComponent(Planner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
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

  it('restores before autosave and retains changes when the planner is recreated', async () => {
    fixture.destroy();
    const inputs = {
      currentAmount: 10_000,
      targetAmount: 100_000,
      years: 1,
      annualReturnRate: 0,
      plannedMonthlyContribution: 1_000,
    };
    localStorage.setItem('money-plan.planner-draft', JSON.stringify({ version: 1, inputs }));
    const save = vi.spyOn(Storage.prototype, 'setItem');
    fixture = TestBed.createComponent(Planner);
    component = fixture.componentInstance;
    expect(component.model()).toEqual(inputs);
    await fixture.whenStable();
    expect(save).toHaveBeenCalledWith(
      'money-plan.planner-draft',
      JSON.stringify({ version: 1, inputs }),
    );
    expect(save).not.toHaveBeenCalledWith(
      'money-plan.planner-draft',
      JSON.stringify({ version: 1, inputs: DEFAULT_PLANNER_INPUTS }),
    );
    component.model.update((value) => ({ ...value, plannedMonthlyContribution: 2_000 }));
    await fixture.whenStable();
    fixture.destroy();
    fixture = TestBed.createComponent(Planner);
    component = fixture.componentInstance;
    await fixture.whenStable();
    expect(component.model()).toEqual({ ...inputs, plannedMonthlyContribution: 2_000 });
    expect(component.totalContributed()).toBe(34_000);
  });

  it('does not replace the last valid draft with invalid edits', async () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.value = '10000';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const saved = localStorage.getItem('money-plan.planner-draft');
    expect(JSON.parse(saved!).inputs.currentAmount).toBe(10_000);
    for (const invalid of ['-100', '']) {
      input.value = invalid;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(component.plannerForm().invalid()).toBe(true);
      expect(localStorage.getItem('money-plan.planner-draft')).toBe(saved);
    }
  });

  it('resets inputs and form interaction state and persists the defaults', async () => {
    component.model.update((value) => ({ ...value, targetAmount: -1 }));
    component.plannerForm.targetAmount().markAsDirty();
    component.plannerForm.targetAmount().markAsTouched();
    await fixture.whenStable();
    expect(component.plannerForm().dirty()).toBe(true);
    expect(component.plannerForm().touched()).toBe(true);
    const reset = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Reset plan',
    )!;
    reset.click();
    await fixture.whenStable();
    expect(component.model()).toEqual(DEFAULT_PLANNER_INPUTS);
    expect(component.plannerForm().dirty()).toBe(false);
    expect(component.plannerForm().touched()).toBe(false);
    expect(component.plannerForm().valid()).toBe(true);
    expect(JSON.parse(localStorage.getItem('money-plan.planner-draft')!)).toEqual({
      version: 1,
      inputs: DEFAULT_PLANNER_INPUTS,
    });
  });

  it('shows a nonblocking storage warning while calculations and reset remain usable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    component.model.set({
      currentAmount: 10_000,
      targetAmount: 100_000,
      years: 1,
      annualReturnRate: 0,
      plannedMonthlyContribution: 1_000,
    });
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('Changes may not survive refresh.');
    expect(component.plannedFutureValue()).toBe(22_000);
    expect(component.plannerForm().valid()).toBe(true);
    component.resetPlan();
    await fixture.whenStable();
    expect(component.model()).toEqual(DEFAULT_PLANNER_INPUTS);
    expect(component.plannerForm().valid()).toBe(true);
  });
  it('keeps the export-only report out of accessibility and keyboard navigation', () => {
    const report = (fixture.nativeElement as HTMLElement).querySelector('.pdf-report-container')!;
    expect(report.getAttribute('aria-hidden')).toBe('true');
    expect(report.hasAttribute('inert')).toBe(true);
    expect(report.querySelector('.pdf-report')?.textContent).toContain('Projection Results');
  });
});
