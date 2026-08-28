export interface InvestmentPlan {
  currentAmount: number;
  targetAmount: number;
  years: number;
  annualReturnRate: number;
}

export interface InvestmentProjection {
  requiredMonthlyContribution: number;
  totalContributed: number;
  totalInterest: number;
  finalAmount: number;
}

export interface InvestmentTimelinePoint {
  year: number;
  contributedAmount: number;
  investmentValue: number;
  interestAmount: number;
}
