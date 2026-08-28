import { expect, it } from 'vitest';
import {
  annualRateToMonthlyRate,
  calculateFutureValue,
  calculateInvestmentTimeline,
  calculateProjection,
  calculateRequiredMonthlyContribution,
} from './finance-calculator';

describe('finance-calculator', () => {
  it('should convert annual rate to equivalent monthly rate', () => {
    const monthlyRate = annualRateToMonthlyRate(12);
    expect(monthlyRate).toBeCloseTo(0.009489, 6);
  });

  it('should calculate monthly contribution without interest', () => {
    const contribution = calculateRequiredMonthlyContribution({
      currentAmount: 0,
      targetAmount: 120_000,
      years: 10,
      annualReturnRate: 0,
    });

    expect(contribution).toBe(1000);
  });
  it('should return zero when current amount already reaches the target', () => {
    const contribution = calculateRequiredMonthlyContribution({
      currentAmount: 100_000,
      targetAmount: 100_000,
      years: 5,
      annualReturnRate: 10,
    });

    expect(contribution).toBe(0);
  });

  it('should calculate future value without interest', () => {
    const result = calculateFutureValue(10_000, 1_000, 1, 0);

    expect(result).toBe(22_000);
  });

  it('should generate a projection that reaches the target', () => {
    const projection = calculateProjection({
      currentAmount: 10_000,
      targetAmount: 100_000,
      years: 5,
      annualReturnRate: 10,
    });

    expect(projection.requiredMonthlyContribution).toBeGreaterThan(0);
    expect(projection.finalAmount).toBeCloseTo(100_000, 2);
    expect(projection.totalInterest).toBeGreaterThan(0);
  });

  it('should calculate the total contributed across all months', () => {
    const projection = calculateProjection({
      currentAmount: 10_000,
      targetAmount: 100_000,
      years: 2,
      annualReturnRate: 8,
    });

    const expectedTotalContributed = 10_000 + projection.requiredMonthlyContribution * 24;

    expect(projection.totalContributed).toBeCloseTo(expectedTotalContributed, 2);
  });

  it('should generate an investment timeline for each year', () => {
    const timeline = calculateInvestmentTimeline(10_000, 1_500, 5, 10);

    expect(timeline).toHaveLength(6);

    expect(timeline[0]).toEqual({
      year: 0,
      contributedAmount: 10_000,
      investmentValue: 10_000,
      interestAmount: 0,
    });

    expect(timeline[5].investmentValue).toBeGreaterThan(timeline[5].contributedAmount);

    expect(timeline[5].interestAmount).toBeGreaterThan(0);
  });
});
