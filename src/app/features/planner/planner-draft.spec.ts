import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlannerDraft } from './planner-draft';
import { DEFAULT_PLANNER_INPUTS } from './planner-inputs';

const key = 'money-plan.planner-draft';
const inputs = {
  currentAmount: 10_000,
  targetAmount: 80_000,
  years: 2,
  annualReturnRate: 4,
  plannedMonthlyContribution: 500,
};

describe('Planner draft', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('writes a versioned record and restores all five inputs', () => {
    const draft = TestBed.inject(PlannerDraft);
    draft.save(inputs);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ version: 1, inputs });
    expect(draft.restore()).toEqual(inputs);
    expect(draft.storageUnavailable()).toBe(false);
  });

  it.each([
    null,
    '{broken',
    'null',
    '[]',
    '{}',
    JSON.stringify({ version: 2, inputs }),
    JSON.stringify({ version: '1', inputs }),
    JSON.stringify({ inputs }),
    JSON.stringify({ version: 1, inputs: { years: 2 } }),
    JSON.stringify({ version: 1, inputs: { ...inputs, years: 0 } }),
    '{"version":1,"inputs":{"currentAmount":1e400,"targetAmount":1,"years":1,"annualReturnRate":0,"plannedMonthlyContribution":0}}',
  ])('uses defaults for an absent or invalid record: %s', (record) => {
    if (record !== null) localStorage.setItem(key, record);
    const draft = TestBed.inject(PlannerDraft);
    expect(draft.restore()).toEqual(DEFAULT_PLANNER_INPUTS);
    expect(draft.storageUnavailable()).toBe(false);
  });

  it('keeps the last valid record when invalid values are saved', () => {
    const draft = TestBed.inject(PlannerDraft);
    draft.save(inputs);
    for (const invalid of [-1, NaN, Infinity]) {
      draft.save({ ...inputs, plannedMonthlyContribution: invalid });
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ version: 1, inputs });
    }
  });

  it('catches storage getter failures', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: {
              get localStorage(): Storage {
                throw new Error('denied');
              },
            },
          },
        },
      ],
    });
    const draft = TestBed.inject(PlannerDraft);
    expect(draft.restore()).toEqual(DEFAULT_PLANNER_INPUTS);
    expect(() => draft.save(inputs)).not.toThrow();
    expect(draft.storageUnavailable()).toBe(true);
  });

  it('handles storage being unavailable', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });
    const draft = TestBed.inject(PlannerDraft);
    expect(draft.restore()).toEqual(DEFAULT_PLANNER_INPUTS);
    draft.save(inputs);
    expect(draft.storageUnavailable()).toBe(true);
  });

  it('catches read failures and restores defaults', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const draft = TestBed.inject(PlannerDraft);
    expect(draft.restore()).toEqual(DEFAULT_PLANNER_INPUTS);
    expect(draft.storageUnavailable()).toBe(true);
  });

  it('catches write failures and preserves the prior record', () => {
    localStorage.setItem(key, JSON.stringify({ version: 1, inputs }));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const draft = TestBed.inject(PlannerDraft);
    expect(() => draft.save(DEFAULT_PLANNER_INPUTS)).not.toThrow();
    expect(draft.storageUnavailable()).toBe(true);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ version: 1, inputs });
  });
});
