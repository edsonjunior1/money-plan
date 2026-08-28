import { InvestmentPlan, InvestmentProjection } from './finance.models';

const MONTHS_PER_YEAR = 12;

export function annualRateToMonthlyRate(annualRatePercent: number): number {
  const annualRate = annualRatePercent / 100;

  return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
}

export function calculateRequiredMonthlyContribution(plan: InvestmentPlan): number {
  const months = plan.years * MONTHS_PER_YEAR;

  if (months <= 0) return 0;

  if (plan.targetAmount <= plan.currentAmount) return 0;

  const monthlyRate = annualRateToMonthlyRate(plan.annualReturnRate);

  if (monthlyRate === 0) return (plan.targetAmount - plan.currentAmount) / months;

  const currentAmountFutureValue = plan.currentAmount * Math.pow(1 + monthlyRate, months);

  const remainingTarget = plan.targetAmount - currentAmountFutureValue;

  if (remainingTarget <= 0) return 0;

  const accumulationFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

  return remainingTarget / accumulationFactor;
}

export function calculateFutureValue(
  currentAmount: number,
  monthlyContribution: number,
  years: number,
  annualReturnRate: number,
): number {
  const months = years * MONTHS_PER_YEAR;

  if (months <= 0) return currentAmount;

  const monthlyRate = annualRateToMonthlyRate(annualReturnRate);

  if (monthlyRate === 0) return currentAmount + monthlyContribution * months;

  const currentAmountFutureValue = currentAmount * Math.pow(1 + monthlyRate, months);

  const contributionsFutureValue =
    monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return currentAmountFutureValue + contributionsFutureValue;
}

export function calculateProjection(plan: InvestmentPlan): InvestmentProjection {
  const requiredMonthlyContribution = calculateRequiredMonthlyContribution(plan);

  const months = plan.years * MONTHS_PER_YEAR;

  const totalContributed = plan.currentAmount + requiredMonthlyContribution * months;

  const finalAmount = calculateFutureValue(
    plan.currentAmount,
    requiredMonthlyContribution,
    plan.years,
    plan.annualReturnRate,
  );

  const totalInterest = finalAmount - totalContributed;

  return {
    requiredMonthlyContribution,
    totalContributed,
    totalInterest,
    finalAmount,
  };
}
