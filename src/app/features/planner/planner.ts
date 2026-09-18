import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
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
  calculateRequiredMonthlyContribution,
} from '../../core/finance/finance-calculator';

import {
  DEFAULT_PLANNER_INPUTS,
  isPlannerInputs,
  PLANNER_INPUT_MINIMUMS,
  PlannerInputs,
} from './planner-inputs';

import { PlannerDraft } from './planner-draft';

import { PageHeading } from '../../shared/page-heading';

@Component({
  selector: 'app-planner',
  imports: [
    CurrencyPipe,
    PageHeading,
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ChartComponent,
  ],
  templateUrl: './planner.html',
  styleUrl: './planner.scss',
})
export class Planner {
  private readonly draft = inject(PlannerDraft);
  readonly storageUnavailable = this.draft.storageUnavailable;
  readonly model = signal<PlannerInputs>(this.draft.restore());

  readonly plannerForm = form(this.model, (path) => {
    validate(path, ({ value }) =>
      isPlannerInputs(value()) ? undefined : { kind: 'invalidInputs' },
    );
    required(path.targetAmount);
    min(path.targetAmount, PLANNER_INPUT_MINIMUMS.targetAmount);

    required(path.years);
    min(path.years, PLANNER_INPUT_MINIMUMS.years);

    min(path.currentAmount, PLANNER_INPUT_MINIMUMS.currentAmount);
    min(path.annualReturnRate, PLANNER_INPUT_MINIMUMS.annualReturnRate);
    min(path.plannedMonthlyContribution, PLANNER_INPUT_MINIMUMS.plannedMonthlyContribution);
  });

  constructor() {
    effect(() => {
      if (this.plannerForm().valid()) this.draft.save(this.model());
    });
  }

  resetPlan(): void {
    this.plannerForm().reset({ ...DEFAULT_PLANNER_INPUTS });
    this.draft.save(this.model());
  }

  readonly requiredMonthlyContribution = computed(() => {
    const value = this.model();

    return calculateRequiredMonthlyContribution({
      currentAmount: value.currentAmount,
      targetAmount: value.targetAmount,
      years: value.years,
      annualReturnRate: value.annualReturnRate,
    });
  });

  readonly totalContributed = computed(() => {
    const value = this.model();
    return value.currentAmount + value.plannedMonthlyContribution * value.years * 12;
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

  readonly estimatedReturns = computed(() => this.plannedFutureValue() - this.totalContributed());

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

  readonly reportContent = viewChild<ElementRef<HTMLElement>>('reportContent');

  readonly isExportingPdf = signal(false);
  readonly exportError = signal(false);

  async exportPdf(): Promise<void> {
    const element = this.reportContent()?.nativeElement;

    if (!element || this.isExportingPdf() || !this.plannerForm().valid()) {
      return;
    }

    this.exportError.set(false);
    this.isExportingPdf.set(true);
    let downloadUrl: string | undefined;
    let link: HTMLAnchorElement | undefined;

    try {
      const [{ default: html2canvas }, { PDFDocument }] = await Promise.all([
        import('html2canvas-pro'),
        import('pdf-lib'),
      ]);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imageData = canvas.toDataURL('image/png');

      const pdf = await PDFDocument.create();
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 28.35;
      const contentWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const image = await pdf.embedPng(
        await fetch(imageData).then((response) => response.arrayBuffer()),
      );
      const imageHeight = (image.height * contentWidth) / image.width;

      for (let offset = 0; offset < imageHeight; offset += printableHeight) {
        const page = pdf.addPage([pageWidth, pageHeight]);
        page.drawImage(image, {
          x: margin,
          y: pageHeight - margin - imageHeight + offset,
          width: contentWidth,
          height: imageHeight,
        });
      }

      const pdfBytes = await pdf.save();
      const pdfBuffer = new Uint8Array(pdfBytes).buffer as ArrayBuffer;
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);
      link = document.createElement('a');

      link.href = downloadUrl;
      link.download = 'money-plan.pdf';
      document.body.append(link);
      link.click();
    } catch {
      this.exportError.set(true);
    } finally {
      try {
        link?.remove();
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      } catch {
        this.exportError.set(true);
      } finally {
        this.isExportingPdf.set(false);
      }
    }
  }
}
