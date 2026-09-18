# Planner reliability

## Problem Statement
Results use required contributions while the growth chart uses planned contributions. Drafts disappear on refresh, unknown URLs are unhandled, and export failures have no recovery feedback.

## Out of Scope
Formula redesign, new validation limits, accounts, cloud or tab synchronization, URL sharing, /planner migration, deployment changes, and visual redesign.

## Assumptions & Open Questions
| Assumption | Chosen default | Rationale |
| --- | --- | --- |
| Persistence | Local device until reset or browser clearing | User confirmed |
| Defaults | currentAmount 0, targetAmount 100000, years 5, annualReturnRate 10, plannedMonthlyContribution 1500 | Existing defaults |
| Constraints | All finite; targetAmount and years >= 1; other fields >= 0 | Existing form limits; no integer restriction added |
| Stack and UI | Angular 22 signals, Signal Forms, lazy routes/imports, English and BRL | User requirement |
| Authorization | Implement, local atomic commits, push main | User confirmed in conversation |
Open questions: none.

## User Stories
As a planner user I want consistent outcomes, retained inputs, navigable error pages, and export retries.

**Acceptance Criteria**
1. When valid inputs change, the planner SHALL use currentAmount + plannedMonthlyContribution * years * 12 for total contributions and planned future value minus contributions for returns in Results, Growth summaries, and PDF. With initial 10000, monthly 1000, years 1, return 0 and target 100000, these SHALL be 22000 contributed, 22000 final, and 0 returns. Required monthly contribution and difference SHALL remain guidance; calculateProjection() SHALL retain its contract.
2. The shared input model SHALL retain all five defaults and validate complete finite numeric inputs against existing minimums.
3. When loading money-plan.planner-draft, storage SHALL accept only version 1 records with valid complete inputs, otherwise return defaults. When saving, storage SHALL write { version: 1, inputs } only for valid inputs and catch unavailable storage and read/write failures.
4. When the planner opens, it SHALL restore before autosave starts. Invalid edits SHALL preserve the prior draft. When Reset plan is activated, it SHALL restore and persist defaults and reset pristine/untouched form state. While storage has failed, the UI SHALL nonblockingly announce that changes may not survive refresh and calculations SHALL remain usable.
5. When navigating to /, the router SHALL lazy-load the planner and set title Financial Planner | Money Plan. When navigating to unknown paths, it SHALL lazy-load a final ** fallback showing Page not found, title Page not found | Money Plan, and Back to planner linking to /. When navigating between pages, it SHALL focus the visible page heading.
6. When export fails, the planner SHALL show an inline alert reading Could not export your PDF. Please try again. When retry starts, it SHALL clear the error and prevent concurrent or invalid exports inside the handler. Success and failure SHALL release loading and clean download resources, retaining lazy imports, money-plan.pdf, and report layout.
7. The implementation SHALL pass npm test -- --watch=false and npm run build, keyboard/focus/alert checks and AXE on both pages, downloaded PDF inspection, and independent outcome verification with a discrimination sensor.

## Requirement Traceability
| ID | Requirement | Task | Status |
| --- | --- | --- | --- |
| PLAN-01 | Planned totals | T1 | verified |
| PLAN-02 | Shared inputs | T2 | verified |
| PLAN-03 | Storage | T3 | implementing |
| PLAN-04 | Autosave/reset | T4 | implementing |
| PLAN-05 | Routing | T5 | implementing |
| PLAN-06 | PDF recovery | T6 | implementing |
| PLAN-07 | Final validation | Verifier | pending |
