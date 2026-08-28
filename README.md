# Money Plan

Money Plan is a frontend financial planning application built with
Angular.

The goal of the project is to provide a simple and interactive way to
estimate how much a person needs to invest every month to reach a
financial target within a specific period.

The application also compares the required monthly contribution with the
amount the user actually plans to invest.

## Features

- Calculate the required monthly contribution to reach a financial
  goal
- Project the future value of a planned monthly contribution
- Compare planned and required monthly investments
- Calculate estimated investment returns
- Calculate total contributed amount
- Validate financial inputs using Angular Signal Forms
- Reactive calculations using Angular Signals and computed signals
- Responsive interface with Tailwind CSS
- Brazilian currency formatting
- Financial calculation unit tests
- Planner behavior tests

## Tech Stack

- Angular 22
- TypeScript 6
- Angular Signals
- Angular Signal Forms
- Angular Router
- Angular Material
- Tailwind CSS 4
- RxJS
- Vitest
- SCSS
- jsPDF
- html2canvas

## Architecture

The project currently follows a feature-oriented structure with
financial domain logic separated from Angular UI code.

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

The financial calculations are implemented as pure TypeScript functions
without dependencies on Angular.

This keeps the business rules independent from the framework and makes
them easier to test, reuse, and maintain.

### Features

The `features/planner` directory contains the financial planner
interface.

Angular Signals are used as the local reactive state mechanism.

Angular Signal Forms are used to bind and validate the planner inputs.

No global state management library is currently required because the
planner state belongs exclusively to the feature.

## Financial Model

The application currently uses an effective annual return rate converted
into an equivalent monthly rate.

The monthly rate is calculated as:

```text
monthlyRate = (1 + annualRate)^(1 / 12) - 1
```

The application assumes that monthly contributions are made at the end
of each month.

The current financial model considers:

- Current amount
- Target amount
- Investment period
- Expected annual return
- Planned monthly contribution

From those values, Money Plan calculates:

- Required monthly contribution
- Projected final amount
- Monthly contribution difference
- Total contributed
- Estimated investment returns

## Signal Forms

The planner uses Angular Signal Forms rather than traditional Reactive
Forms.

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

Inputs are connected directly to the form field tree:

```html
<input type="number" [formField]="plannerForm.targetAmount" />
```

Calculations automatically react to changes in the underlying signal
model.

## Development

The project requires Node.js 24.

The version currently used during development is:

```text
Node.js 24.15.0
npm 11.x
Angular CLI 22.x
```

Install the dependencies:

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
Tests       15 passed
```

The tests currently cover both the financial domain logic and planner
behavior.

Examples include:

- Annual-to-monthly interest rate conversion
- Required monthly contribution
- Future value calculation
- Projection calculation
- Contribution accumulation
- Planner default values
- Reactive recalculation
- Goal tracking status
- Signal Form behavior

## Build

Create a production build with:

```bash
npm run build
```

Angular will generate the production files inside the `dist/` directory.

## Current Status

The project is currently under active development.

The core financial calculation engine, Signal Forms integration, form
validation, planner interface, and automated tests are already
implemented.

Future iterations may include additional financial scenarios, improved
UI components, charts, and PDF export.

## Disclaimer

Money Plan is an educational financial planning tool.

The calculations provided by the application are simulations based on
the values entered by the user and should not be considered financial or
investment advice.

Actual investment returns may differ from the projected values.

## License

This project is intended for educational and portfolio purposes.
