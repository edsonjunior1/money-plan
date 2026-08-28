import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';

import {
  calculateFutureValue,
  calculateProjection,
  calculateRequiredMonthlyContribution,
} from '../../core/finance/finance-calculator';

interface PlannerFormModel {
  currentAmount: number;
  targetAmount: number;
  years: number;
  annualReturnRate: number;
  plannedMonthlyContribution: number;
}

@Component({
  selector: 'app-planner',
  imports: [CurrencyPipe, FormField],
  templateUrl: './planner.html',
  styleUrl: './planner.scss',
})
export class Planner {
  readonly model = signal<PlannerFormModel>({
    currentAmount: 0,
    targetAmount: 100_000,
    years: 5,
    annualReturnRate: 10,
    plannedMonthlyContribution: 1_500,
  });

  readonly plannerForm = form(this.model, (path) => {
    required(path.targetAmount);
    min(path.targetAmount, 1);

    required(path.years);
    min(path.years, 1);

    min(path.currentAmount, 0);
    min(path.annualReturnRate, 0);
    min(path.plannedMonthlyContribution, 0);
  });

  readonly requiredMonthlyContribution = computed(() => {
    const value = this.model();

    return calculateRequiredMonthlyContribution({
      currentAmount: value.currentAmount,
      targetAmount: value.targetAmount,
      years: value.years,
      annualReturnRate: value.annualReturnRate,
    });
  });

  readonly projection = computed(() => {
    const value = this.model();

    return calculateProjection({
      currentAmount: value.currentAmount,
      targetAmount: value.targetAmount,
      years: value.years,
      annualReturnRate: value.annualReturnRate,
    });
  });

  readonly plannedFutureValue = computed(() => {
    const value = this.model();

    return calculateFutureValue(
      value.currentAmount,
      value.plannedMonthlyContribution,
      value.years,
      value.annualReturnRate,
    );
  });

  readonly monthlyDifference = computed(
    () => this.model().plannedMonthlyContribution - this.requiredMonthlyContribution(),
  );

  readonly isOnTrack = computed(() => this.monthlyDifference() >= 0);
}
