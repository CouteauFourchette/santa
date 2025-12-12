import type { Constraint } from '../types';

export interface ConstraintBuilderOptions {
  participants: string[];
  constraints: Constraint[];
  onChange: (constraints: Constraint[]) => void;
}

export function renderConstraintBuilder(
  container: HTMLElement,
  options: ConstraintBuilderOptions
): void {
  const { participants, constraints, onChange } = options;

  // Filter out any constraints that reference non-existent participants
  const validConstraints = constraints.filter(
    (c) => participants.includes(c.from) && participants.includes(c.to)
  );

  // If constraints were filtered, notify parent
  if (validConstraints.length !== constraints.length) {
    setTimeout(() => onChange(validConstraints), 0);
  }

  const hasEnoughParticipants = participants.length >= 2;

  container.innerHTML = `
    <div class="constraint-builder">
      <label class="block text-santa-bg font-semibold mb-2">
        Constraints <span class="font-normal text-santa-bg/60">(optional)</span>
      </label>

      ${
        hasEnoughParticipants
          ? `
        <div class="bg-white border border-santa-green/30 rounded-lg p-4">
          <!-- Add Constraint Form -->
          <div class="flex flex-wrap gap-2 items-center mb-4">
            <select
              id="constraint-from"
              class="px-3 py-2 border border-santa-green/30 rounded-lg bg-white text-santa-bg focus:ring-2 focus:ring-santa-gold focus:border-transparent"
            >
              <option value="">Select person</option>
              ${participants.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
            </select>

            <select
              id="constraint-type"
              class="px-3 py-2 border border-santa-green/30 rounded-lg bg-white text-santa-bg focus:ring-2 focus:ring-santa-gold focus:border-transparent"
            >
              <option value="exclude">cannot gift</option>
              <option value="must">must gift</option>
            </select>

            <select
              id="constraint-to"
              class="px-3 py-2 border border-santa-green/30 rounded-lg bg-white text-santa-bg focus:ring-2 focus:ring-santa-gold focus:border-transparent"
            >
              <option value="">Select person</option>
              ${participants.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
            </select>

            <button
              type="button"
              id="add-constraint-btn"
              class="px-4 py-2 bg-santa-gold text-santa-bg font-semibold rounded-lg hover:bg-santa-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add
            </button>
          </div>

          <div id="constraint-error" class="hidden mb-3 text-sm text-santa-red"></div>

          <!-- Constraint List -->
          <div id="constraint-list" class="space-y-2">
            ${
              validConstraints.length === 0
                ? `
              <p class="text-santa-bg/50 text-sm py-2">
                No constraints yet — everyone can be matched with anyone
              </p>
            `
                : validConstraints
                    .map(
                      (c, index) => `
              <div class="constraint-card flex items-center justify-between p-3 bg-santa-cream rounded-lg border border-santa-green/10">
                <div class="flex items-center gap-2">
                  <span class="text-lg">${c.type === 'exclude' ? '🚫' : '🎯'}</span>
                  <span class="text-santa-bg">
                    <strong>${escapeHtml(c.from)}</strong>
                    <span class="text-santa-bg/60 mx-1">${c.type === 'exclude' ? 'cannot gift' : 'must gift'}</span>
                    <strong>${escapeHtml(c.to)}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  class="remove-constraint p-1 text-santa-bg/40 hover:text-santa-red transition-colors"
                  data-index="${index}"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            `
                    )
                    .join('')
            }
          </div>
        </div>
      `
          : `
        <div class="bg-white/50 border border-santa-green/20 rounded-lg p-4 text-santa-bg/50 text-sm">
          Add at least 2 participants to create constraints
        </div>
      `
      }
    </div>
  `;

  if (!hasEnoughParticipants) return;

  const fromSelect = container.querySelector<HTMLSelectElement>('#constraint-from')!;
  const typeSelect = container.querySelector<HTMLSelectElement>('#constraint-type')!;
  const toSelect = container.querySelector<HTMLSelectElement>('#constraint-to')!;
  const addBtn = container.querySelector<HTMLButtonElement>('#add-constraint-btn')!;
  const errorDiv = container.querySelector<HTMLDivElement>('#constraint-error')!;

  function showError(message: string): void {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
      errorDiv.classList.add('hidden');
    }, 3000);
  }

  function addConstraint(): void {
    const from = fromSelect.value;
    const to = toSelect.value;
    const type = typeSelect.value as 'exclude' | 'must';

    if (!from || !to) {
      showError('Please select both people');
      return;
    }

    if (from === to) {
      showError('A person cannot be constrained with themselves');
      return;
    }

    // Check for duplicate
    const exists = validConstraints.some(
      (c) => c.from === from && c.to === to && c.type === type
    );
    if (exists) {
      showError('This constraint already exists');
      return;
    }

    // Check for conflicting must-match (same person already has a must-match)
    if (type === 'must') {
      const existingMust = validConstraints.find(
        (c) => c.type === 'must' && c.from === from
      );
      if (existingMust) {
        showError(`${from} already has a must-gift constraint to ${existingMust.to}`);
        return;
      }
    }

    onChange([...validConstraints, { type, from, to }]);

    // Reset selects
    fromSelect.value = '';
    toSelect.value = '';
  }

  // Add button click
  addBtn.addEventListener('click', addConstraint);

  // Remove buttons
  container.querySelectorAll('.remove-constraint').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index!, 10);
      const newConstraints = validConstraints.filter((_, i) => i !== index);
      onChange(newConstraints);
    });
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
