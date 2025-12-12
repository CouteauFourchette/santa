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
      <div class="flex items-center justify-between mb-2">
        <label class="block text-santa-bg font-semibold">
          Constraints <span class="font-normal text-santa-bg/60">(optional)</span>
        </label>
        ${hasEnoughParticipants ? `
        <button
          type="button"
          id="paste-constraints-btn"
          class="text-sm text-santa-green hover:text-santa-green-light transition-colors"
        >
          Paste list
        </button>
        ` : ''}
      </div>

      <!-- Paste Modal -->
      <div id="paste-constraints-modal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-santa-cream rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-bold text-santa-bg mb-2">Paste Constraints</h3>
          <p class="text-sm text-santa-bg/60 mb-3">One per line. Format:<br/>
            <code class="bg-white px-1 rounded">Alice !-> Bob</code> (cannot gift)<br/>
            <code class="bg-white px-1 rounded">Alice -> Bob</code> (must gift)
          </p>
          <textarea
            id="paste-constraints-textarea"
            rows="6"
            class="w-full px-3 py-2 border border-santa-green/30 rounded-lg focus:ring-2 focus:ring-santa-gold focus:border-transparent bg-white text-santa-bg resize-none font-mono text-sm"
            placeholder="Alice !-> Bob&#10;Charlie -> Diana"
          ></textarea>
          <div class="flex gap-2 mt-4">
            <button
              type="button"
              id="paste-constraints-cancel-btn"
              class="flex-1 px-4 py-2 border border-santa-green/30 text-santa-bg rounded-lg hover:bg-santa-cream-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="paste-constraints-confirm-btn"
              class="flex-1 px-4 py-2 bg-santa-gold text-santa-bg font-semibold rounded-lg hover:bg-santa-gold-light transition-colors"
            >
              Add All
            </button>
          </div>
        </div>
      </div>

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

  // Paste modal handlers
  const pasteBtn = container.querySelector<HTMLButtonElement>('#paste-constraints-btn');
  const pasteModal = container.querySelector<HTMLDivElement>('#paste-constraints-modal')!;
  const pasteTextarea = container.querySelector<HTMLTextAreaElement>('#paste-constraints-textarea')!;
  const pasteCancelBtn = container.querySelector<HTMLButtonElement>('#paste-constraints-cancel-btn')!;
  const pasteConfirmBtn = container.querySelector<HTMLButtonElement>('#paste-constraints-confirm-btn')!;

  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      pasteTextarea.value = '';
      pasteModal.classList.remove('hidden');
      pasteTextarea.focus();
    });
  }

  pasteCancelBtn.addEventListener('click', () => {
    pasteModal.classList.add('hidden');
  });

  pasteModal.addEventListener('click', (e) => {
    if (e.target === pasteModal) {
      pasteModal.classList.add('hidden');
    }
  });

  pasteConfirmBtn.addEventListener('click', () => {
    const text = pasteTextarea.value;
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const newConstraints: Constraint[] = [...validConstraints];

    for (const line of lines) {
      // Must-match: "Alice -> Bob" (but not "!->")
      const mustMatch = line.match(/^(.+?)\s*->\s*(.+)$/);
      if (mustMatch && !line.includes('!')) {
        const from = mustMatch[1].trim();
        const to = mustMatch[2].trim();
        if (
          participants.includes(from) &&
          participants.includes(to) &&
          from !== to &&
          !newConstraints.some((c) => c.from === from && c.to === to && c.type === 'must')
        ) {
          // Check no existing must constraint for this person
          if (!newConstraints.some((c) => c.type === 'must' && c.from === from)) {
            newConstraints.push({ type: 'must', from, to });
          }
        }
        continue;
      }

      // Exclusion: "Alice !-> Bob" or "Alice !> Bob"
      const exclude = line.match(/^(.+?)\s*!-?>\s*(.+)$/);
      if (exclude) {
        const from = exclude[1].trim();
        const to = exclude[2].trim();
        if (
          participants.includes(from) &&
          participants.includes(to) &&
          from !== to &&
          !newConstraints.some((c) => c.from === from && c.to === to && c.type === 'exclude')
        ) {
          newConstraints.push({ type: 'exclude', from, to });
        }
        continue;
      }
    }

    pasteModal.classList.add('hidden');
    if (newConstraints.length !== validConstraints.length) {
      onChange(newConstraints);
    }
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
