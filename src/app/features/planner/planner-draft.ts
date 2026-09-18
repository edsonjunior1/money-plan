import { DOCUMENT, inject, Service, signal } from '@angular/core';
import { DEFAULT_PLANNER_INPUTS, isPlannerInputs, PlannerInputs } from './planner-inputs';

const DRAFT_KEY = 'money-plan.planner-draft';

@Service()
export class PlannerDraft {
  private readonly document = inject(DOCUMENT);
  private readonly unavailable = signal(false);
  readonly storageUnavailable = this.unavailable.asReadonly();

  restore(): PlannerInputs {
    let record: string | null;
    try {
      record = this.storage().getItem(DRAFT_KEY);
    } catch {
      this.unavailable.set(true);
      return { ...DEFAULT_PLANNER_INPUTS };
    }

    if (record !== null) {
      try {
        const draft: unknown = JSON.parse(record);
        if (
          typeof draft === 'object' &&
          draft !== null &&
          'version' in draft &&
          draft.version === 1 &&
          'inputs' in draft &&
          isPlannerInputs(draft.inputs)
        ) {
          return { ...draft.inputs };
        }
      } catch {
        // Invalid records are discarded in favor of the existing defaults.
      }
    }
    return { ...DEFAULT_PLANNER_INPUTS };
  }

  save(inputs: PlannerInputs): void {
    if (!isPlannerInputs(inputs)) return;
    try {
      this.storage().setItem(DRAFT_KEY, JSON.stringify({ version: 1, inputs }));
    } catch {
      this.unavailable.set(true);
    }
  }

  private storage(): Storage {
    const storage = this.document.defaultView?.localStorage;
    if (!storage) throw new Error('Local storage unavailable');
    return storage;
  }
}
