import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
} from 'ng-apexcharts';

import {
  calculateFutureValue,
  calculateInvestmentTimeline,
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
  imports: [
    CurrencyPipe,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    ChartComponent,
  ],
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

  readonly investmentTimeline = computed(() => {
    const value = this.model();

    return calculateInvestmentTimeline(
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

  readonly estimatedReturns = computed(() => {
    const timeline = this.investmentTimeline();

    return timeline[timeline.length - 1]?.interestAmount ?? 0;
  });

  readonly chartSeries = computed<ApexAxisChartSeries>(() => {
    const timeline = this.investmentTimeline();

    return [
      {
        name: 'Investment value',
        type: 'area',
        data: timeline.map((point) => point.investmentValue),
      },
      {
        name: 'Total contributed',
        type: 'line',
        data: timeline.map((point) => point.contributedAmount),
      },
      {
        name: 'Investment returns',
        type: 'line',
        data: timeline.map((point) => point.interestAmount),
      },
    ];
  });

  readonly chartOptions: ApexChart = {
    type: 'line',
    height: 360,
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  };

  readonly chartStroke: ApexStroke = {
    curve: 'smooth',
    width: [3, 2, 2],
    dashArray: [0, 0, 6],
  };

  readonly chartDataLabels: ApexDataLabels = {
    enabled: false,
  };

  readonly chartXAxis = computed<ApexXAxis>(() => ({
    categories: this.investmentTimeline().map((point) => `Year ${point.year}`),
    labels: {
      rotate: 0,
    },
  }));

  readonly chartYAxis: ApexYAxis = {
    labels: {
      formatter: (value: number) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(value),
    },
  };

  readonly chartTooltip: ApexTooltip = {
    shared: true,
    intersect: false,
    y: {
      formatter: (value: number) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value),
    },
  };

  readonly chartLegend: ApexLegend = {
    position: 'top',
    horizontalAlign: 'center',
  };
}
