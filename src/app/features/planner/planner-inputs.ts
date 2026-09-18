export interface PlannerInputs {
  currentAmount: number;
  targetAmount: number;
  years: number;
  annualReturnRate: number;
  plannedMonthlyContribution: number;
}

export const DEFAULT_PLANNER_INPUTS: Readonly<PlannerInputs> = Object.freeze({
  currentAmount: 0,
  targetAmount: 100_000,
  years: 5,
  annualReturnRate: 10,
  plannedMonthlyContribution: 1_500,
});

export const PLANNER_INPUT_MINIMUMS: Readonly<PlannerInputs> = {
  currentAmount: 0,
  targetAmount: 1,
  years: 1,
  annualReturnRate: 0,
  plannedMonthlyContribution: 0,
};

export function isPlannerInputs(value: unknown): value is PlannerInputs {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  const inputs = value as Record<string, unknown>;
  return Object.entries(PLANNER_INPUT_MINIMUMS).every(([field, minimum]) => {
    const input = inputs[field];
    return typeof input === 'number' && Number.isFinite(input) && input >= minimum;
  });
}
