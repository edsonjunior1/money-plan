# Money Plan

Money Plan is a frontend financial planning application built with Angular 22.

The project provides an interactive way to estimate how much a person needs to invest every month to reach a financial target within a specific period. It also compares the required monthly contribution with the amount the user actually plans to invest and visualizes how contributions, returns, and investment value evolve over time.

## Features

- Calculate the required monthly contribution to reach a financial goal
- Project the future value of a planned monthly contribution
- Compare planned and required monthly investments
- Calculate estimated investment returns
- Calculate total contributed amount
- Generate a yearly investment timeline
- Display investment growth with interactive ApexCharts visualizations
- Show target amount, projected amount, and estimated returns summaries
- Validate financial inputs using Angular Signal Forms
- Reactive calculations using Angular Signals and computed signals
- Responsive interface with Angular Material and Tailwind CSS
- Brazilian currency formatting
- Export a dedicated financial report as PDF
- Separate PDF report layout from the interactive application UI
- Automated tests for financial domain logic, planner behavior, and root application rendering

## Tech Stack

- Angular 22
- TypeScript 6
- Angular Signals
- Angular Signal Forms
- Angular Router
- Angular Material
- Tailwind CSS 4
- RxJS
- ApexCharts 7
- ng-apexcharts 3
- Vitest 4
- SCSS
- jsPDF 4
- html2canvas-pro 2

## Architecture

The project follows a feature-oriented structure with financial domain logic separated from Angular UI code.

```text
src/
├── app/
│   ├── core/
│   │   └── finance/
│   │       ├── finance-calculator.ts
│   │       ├── finance-calculator.spec.ts
│   │       └── finance.models.ts
│   │
│   ├── features/
│   │   └── planner/
│   │       ├── planner.ts
│   │       ├── planner.html
│   │       ├── planner.scss
│   │       └── planner.spec.ts
│   │
│   ├── shared/
│   │
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── app.ts
│   ├── app.html
│   ├── app.scss
│   └── app.spec.ts
│
├── main.ts
├── index.html
├── styles.scss
└── tailwind.css
```

### Core

The `core/finance` directory contains the financial domain logic.

The financial calculations are implemented as pure TypeScript functions without Angular dependencies. This keeps the business rules independent from the framework and makes them easier to test, reuse, and maintain.

The current finance engine provides:

- annual-to-monthly effective rate conversion
- required monthly contribution calculation
- future value calculation
- investment projection calculation
- yearly investment timeline generation

### Features

The `features/planner` directory contains the financial planner interface.

Angular Signals are used as the local reactive state mechanism, while Angular Signal Forms bind and validate the planner inputs.

The planner also owns the presentation-specific concerns for the current feature, including chart configuration and PDF report generation.

No global state management library is currently required because the planner state belongs exclusively to the feature.

## Financial Model

The application uses an effective annual return rate converted into an equivalent monthly rate.

The monthly rate is calculated as:

```text
monthlyRate = (1 + annualRate)^(1 / 12) - 1
```

The annual rate entered by the user is represented as a percentage. For example, `10` means an expected annual return of 10%.

The application assumes that monthly contributions are made at the end of each month.

The current financial model considers:

- Current amount
- Target amount
- Investment period
- Expected annual return
- Planned monthly contribution

From those values, Money Plan calculates:

- Required monthly contribution
- Projected final amount using the planned contribution
- Monthly contribution difference
- Total contributed amount
- Estimated investment returns
- Year-by-year contributed amount
- Year-by-year investment value
- Year-by-year accumulated returns

## Signal Forms

The planner uses Angular Signal Forms rather than traditional Reactive Forms.

The form model is represented by a writable signal:

```ts
readonly model = signal<PlannerFormModel>({
  currentAmount: 0,
  targetAmount: 100_000,
  years: 5,
  annualReturnRate: 10,
  plannedMonthlyContribution: 1_500,
});
```

The Signal Form is created directly from the model:

```ts
readonly plannerForm = form(this.model, (path) => {
  required(path.targetAmount);
  min(path.targetAmount, 1);

  required(path.years);
  min(path.years, 1);

  min(path.currentAmount, 0);
  min(path.annualReturnRate, 0);
  min(path.plannedMonthlyContribution, 0);
});
```

Inputs are connected directly to the field tree:

```html
<input type="number" [formField]="plannerForm.targetAmount" />
```

Calculations automatically react to changes in the underlying signal model.

## Investment Growth Chart

The planner uses ApexCharts through `ng-apexcharts` to visualize the yearly projection.

The chart currently displays three series:

- Investment value
- Total contributed
- Investment returns

The data comes from the same pure financial calculation layer used by the rest of the application, keeping the visualization derived from a single source of truth.

The interface also displays summary values for:

- Target amount
- Projected amount
- Estimated returns

## PDF Export

Money Plan can generate a PDF report from the current financial plan.

The export uses:

- `html2canvas-pro` to render the report content
- `jsPDF` to generate and download the PDF document

A dedicated report layout is rendered separately from the interactive form. This avoids exporting Material input controls and produces a cleaner financial report containing the plan values, projection results, goal status, and investment growth chart.

`html2canvas-pro` is used instead of the original `html2canvas` package because the UI stack uses modern CSS color functions such as `oklch()`.

## Development

The project requires Node.js 24.

The development environment currently uses:

```text
Node.js 24.15.0
npm 11.x
Angular CLI 22.x
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The application will be available at:

```text
http://localhost:4200
```

## Tests

Run the test suite with:

```bash
npm test
```

Current test suite:

```text
Test Files  3 passed
Tests       17 passed
```

The tests currently cover the financial domain logic, planner behavior, and root application rendering.

Examples include:

- Annual-to-monthly interest rate conversion
- Required monthly contribution
- Zero-interest calculations
- Future value calculation
- Projection calculation
- Contribution accumulation
- Investment timeline generation
- Planner default values
- Reactive recalculation
- Goal tracking status
- Planned contribution projection
- Planner timeline integration
- Root application creation
- Router outlet rendering

## Build

Create a production build with:

```bash
npm run build
```

Angular generates the production files inside the `dist/` directory.

## Current Status

The main planner flow is implemented.

The project currently includes:

- financial calculation engine
- Angular Signal Forms integration
- validation
- reactive planner interface
- Angular Material components
- investment growth chart
- financial summary cards
- dedicated PDF report export
- automated tests

The next project milestone is production validation followed by deployment as a static application.

## Roadmap

Potential future improvements include:

- Additional investment scenarios
- Inflation-adjusted projections
- More flexible contribution schedules
- Reusable formatting utilities
- Additional chart views
- Improved PDF pagination and report metadata
- Accessibility and responsive UI refinements
- GitHub Pages deployment

## Disclaimer

Money Plan is an educational financial planning tool.

The calculations provided by the application are simulations based on the values entered by the user and should not be considered financial or investment advice.

Actual investment returns may differ from the projected values.

## License

This project is intended for educational and portfolio purposes.
