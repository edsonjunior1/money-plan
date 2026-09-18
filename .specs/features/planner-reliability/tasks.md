# Planner reliability tasks

## Execution Protocol
Use tlc-spec-driven Execute with one verified local commit per task and a fresh independent verifier after the final task. User approved implementation and push to main. Tests accompany their deliverable.

## Test Coverage Matrix
Guidelines: AGENTS.md; existing co-located Vitest component and finance tests; package.json and angular.json.

| Layer | Required Test Type | Coverage Expectation | Location | Command |
| --- | --- | --- | --- | --- |
| Input model / storage | unit | Every specified boundary and failure | co-located *.spec.ts | npm test -- --watch=false |
| Planner | integration | Exact outcomes and each stated edge/failure | planner.spec.ts and planner-export.spec.ts | npm test -- --watch=false |
| Routes | integration | Both routes, titles, focus and return navigation | app.routes.spec.ts | npm test -- --watch=false |
| Browser | manual + AXE | Keyboard, announcements, focus, PDF | validation.md | Browser against local server |

## Gate Check Commands
| Gate | Command |
| --- | --- |
| Quick / Full | npm test -- --watch=false |
| Build | npm test -- --watch=false and npm run build |
No lint script is configured. Use installed Prettier to check touched files.

## Execution Plan
Execute T1 through T6 sequentially. Dependency arrows:
```
T2 -> T3 -> T4
```

## Task Breakdown

### T1: Planned totals
**Where**: `src/app/features/planner/planner.ts` (with its associated template and co-located tests when applicable)
**Depends on**: None
**Requirement**: PLAN-01
**Tests**: Component integration: assert exact totals in Results, Growth summaries and report; target changes only guidance.
**Gate**: Full
**Commit**: `fix(planner): use planned contributions throughout results`
**Done when**: PLAN-01 outcomes pass their tests and review.
**Status**: complete

### T2: Shared inputs
**Where**: `src/app/features/planner/planner-inputs.ts` (with its associated template and co-located tests when applicable)
**Depends on**: None
**Requirement**: PLAN-02
**Tests**: Unit: five defaults, complete finite numbers, minimum boundaries and invalid values. Existing planner defaults stay equal.
**Gate**: Full
**Commit**: `refactor(planner): share typed inputs and defaults`
**Done when**: PLAN-02 outcomes pass their tests and review.
**Status**: complete

### T3: Draft storage
**Where**: `src/app/features/planner/planner-draft.ts` (with its associated template and co-located tests when applicable)
**Depends on**: T2
**Requirement**: PLAN-03
**Tests**: Unit: valid roundtrip; absent/malformed/unsupported/incomplete records; getter, read and write failures; invalid saves preserve prior record.
**Gate**: Full
**Commit**: `feat(planner): persist validated local drafts`
**Done when**: PLAN-03 outcomes pass their tests and review.
**Status**: complete

### T4: Autosave and reset
**Where**: `src/app/features/planner/planner.ts` (with its associated template and co-located tests when applicable)
**Depends on**: T3
**Requirement**: PLAN-04
**Tests**: Component integration: restore before first write, reload, invalid edits, reset and pristine/untouched state, warning and usable results after storage failure.
**Gate**: Full
**Commit**: `feat(planner): restore drafts and reset plans`
**Done when**: PLAN-04 outcomes pass their tests and review.
**Status**: complete

### T5: Route handling
**Where**: `src/app/app.routes.ts` (with its associated template and co-located tests when applicable)
**Depends on**: None
**Requirement**: PLAN-05
**Tests**: RouterTestingHarness: lazy routes, titles, unknown nested paths, return link and heading focus.
**Gate**: Full
**Commit**: `feat(routing): handle unknown pages and heading focus`
**Done when**: PLAN-05 outcomes pass their tests and review.
**Status**: pending

### T6: PDF recovery
**Where**: `src/app/features/planner/planner.ts` (with its associated template and co-located tests when applicable)
**Depends on**: None
**Requirement**: PLAN-06
**Tests**: Component integration: dependency failures, exact alert, loading cleanup, retry success, duplicate and invalid guards, object URL and anchor cleanup.
**Gate**: Build
**Commit**: `fix(planner): recover from PDF export failures`
**Done when**: PLAN-06 outcomes pass their tests and review.
**Status**: pending

## Diagram-Definition Cross-Check
| Task | Depends on | Diagram | Match |
| --- | --- | --- | --- |
| T1 | None | None | yes |
| T2 | None | None | yes |
| T3 | T2 | T2 -> T3 | yes |
| T4 | T3 | T3 -> T4 | yes |
| T5 | None | None | yes |
| T6 | None | None | yes |

## Test Co-location Validation
| Tasks | Required | Planned | Match |
| --- | --- | --- | --- |
| T1, T4, T5, T6 | integration | integration in each task | yes |
| T2, T3 | unit | unit in each task | yes |

## T1 adequacy review
Gate: 19 tests pass. No existing tests removed or weakened.
| AC | Evidence and assertion | Outcome |
| --- | --- | --- |
| PLAN-01 exact totals/guidance | src/app/features/planner/planner.spec.ts:106 expect(component.totalContributed()).toBe(22_000); lines 107-110 final/returns/guidance | 22000 / 0 / 7500 / -6500 |
| PLAN-01 all summaries | src/app/features/planner/planner.spec.ts:116 expect(text).toMatch(/Total contributed\s+R\$\s*22\.000,00/); lines 117-118 returns/final | Exact BRL across three surfaces |
| PLAN-01 target independence | src/app/features/planner/planner.spec.ts:122 expect(component.totalContributed()).toBe(22_000); lines 123-126 guidance | Same totals, changed guidance |
| PLAN-01 final minus contributions | src/app/features/planner/planner.spec.ts:132 expect(component.estimatedReturns()).toBe(component.plannedFutureValue() - 27_000) | Fractional duration uses actual final value |
Reverse mapping: both added tests map only to PLAN-01. Co-located Vitest style follows AGENTS.md. Assertions cover values and displayed outcomes, not call counts. calculateProjection is unchanged.

## T2 adequacy review
Gate: 27 tests pass, 8 added; all preserved tests pass.
| AC | Evidence and assertion | Outcome |
| --- | --- | --- |
| PLAN-02 defaults | src/app/features/planner/planner-inputs.spec.ts:5 expect(DEFAULT_PLANNER_INPUTS).toEqual(...) | Exact five-field defaults |
| PLAN-02 boundaries | src/app/features/planner/planner-inputs.spec.ts:16 expect(isPlannerInputs(...)).toBe(true); line 25 fractional years | Existing limits accepted |
| PLAN-02 complete finite numbers | src/app/features/planner/planner-inputs.spec.ts:38 expect(isPlannerInputs(incomplete)).toBe(false); line 40 invalid values for each field | Missing, NaN, infinities, wrong types and negatives rejected |
| PLAN-02 lower limits | src/app/features/planner/planner-inputs.spec.ts:46 expect(isPlannerInputs({ ...DEFAULT_PLANNER_INPUTS, targetAmount: 0.5 })).toBe(false); lines 47-49 | Invalid duration and root values rejected |
Reverse mapping: all eight added unit cases map to PLAN-02. No framework-only assertions. Co-located tests meet AGENTS.md and existing conventions.

## T3 adequacy review
Gate: 44 tests pass, 17 added. Existing cases preserved.
| AC | Evidence and assertion | Outcome |
| --- | --- | --- |
| PLAN-03 record payload/restore | src/app/features/planner/planner-draft.spec.ts:27 expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ version: 1, inputs }); line 28 restore | Exact version and five values |
| PLAN-03 invalid records | src/app/features/planner/planner-draft.spec.ts:47 expect(draft.restore()).toEqual(DEFAULT_PLANNER_INPUTS) | Defaults for absent, malformed, unsupported, incomplete, invalid inputs |
| PLAN-03 invalid save | src/app/features/planner/planner-draft.spec.ts:56 expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ version: 1, inputs }) | Last valid record retained |
| PLAN-03 storage failures | src/app/features/planner/planner-draft.spec.ts:78 expect(draft.storageUnavailable()).toBe(true); lines 86-108 unavailable/read/write outcomes | Defaults, failure signal, prior record retained |
Reverse mapping: every added case maps to PLAN-03's explicit storage paths. Payloads and fallback values are asserted; no shallow call-count-only cases. Co-located Vitest tests follow project conventions.

## T4 adequacy review
Gate: 48 tests pass, 4 added. All existing tests retained; test setup now isolates localStorage.
| AC | Evidence and assertion | Outcome |
| --- | --- | --- |
| PLAN-04 restore/save ordering | src/app/features/planner/planner.spec.ts:155 expect(component.model()).toEqual(inputs); lines 157-172 assert first payload and recreated model | Restored values saved, defaults never overwrite |
| PLAN-04 invalid edits | src/app/features/planner/planner.spec.ts:187 expect(localStorage.getItem('money-plan.planner-draft')).toBe(saved) | Negative/empty DOM edits preserve valid record |
| PLAN-04 reset | src/app/features/planner/planner.spec.ts:203 expect(component.model()).toEqual(DEFAULT_PLANNER_INPUTS); lines 204-210 assert dirty/touched false and exact persisted defaults | Defaults and interaction state reset |
| PLAN-04 failure UI | src/app/features/planner/planner.spec.ts:225 expect(...status.textContent).toContain('Changes may not survive refresh.'); line 228 expect(component.plannedFutureValue()).toBe(22_000) | Warning and usable calculations/reset |
Reverse mapping: four added integration cases map to PLAN-04. DOM edits and button activation test user outcomes. Existing minimum rules are retained; the shared guard also rejects empty/nonfinite numeric edits. No unrelated tests or changes.
