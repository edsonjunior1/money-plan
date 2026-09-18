import { DEFAULT_PLANNER_INPUTS, isPlannerInputs } from './planner-inputs';

describe('Planner inputs', () => {
  it('preserves the five existing defaults', () => {
    expect(DEFAULT_PLANNER_INPUTS).toEqual({
      currentAmount: 0,
      targetAmount: 100_000,
      years: 5,
      annualReturnRate: 10,
      plannedMonthlyContribution: 1_500,
    });
    expect(isPlannerInputs(DEFAULT_PLANNER_INPUTS)).toBe(true);
  });

  it('accepts minimum boundaries and fractional durations', () => {
    expect(
      isPlannerInputs({
        currentAmount: 0,
        targetAmount: 1,
        years: 1,
        annualReturnRate: 0,
        plannedMonthlyContribution: 0,
      }),
    ).toBe(true);
    expect(isPlannerInputs({ ...DEFAULT_PLANNER_INPUTS, years: 1.5 })).toBe(true);
  });

  for (const field of [
    'currentAmount',
    'targetAmount',
    'years',
    'annualReturnRate',
    'plannedMonthlyContribution',
  ]) {
    it(`rejects missing or invalid ${field}`, () => {
      const incomplete: Record<string, unknown> = { ...DEFAULT_PLANNER_INPUTS };
      delete incomplete[field];
      expect(isPlannerInputs(incomplete)).toBe(false);
      for (const value of [NaN, Infinity, -Infinity, null, undefined, '100', -1]) {
        expect(isPlannerInputs({ ...DEFAULT_PLANNER_INPUTS, [field]: value })).toBe(false);
      }
    });
  }

  it('rejects target and duration below one and non-object inputs', () => {
    expect(isPlannerInputs({ ...DEFAULT_PLANNER_INPUTS, targetAmount: 0.5 })).toBe(false);
    expect(isPlannerInputs({ ...DEFAULT_PLANNER_INPUTS, years: 0.5 })).toBe(false);
    for (const value of [null, undefined, [], 1, 'inputs']) {
      expect(isPlannerInputs(value)).toBe(false);
    }
  });
});
