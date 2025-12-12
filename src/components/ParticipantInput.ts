export interface ParticipantInputOptions {
  participants: string[];
  onChange: (participants: string[]) => void;
}

export function renderParticipantInput(
  container: HTMLElement,
  options: ParticipantInputOptions
): void {
  const { participants, onChange } = options;

  container.innerHTML = `
    <div class="participant-input">
      <label class="block text-santa-bg font-semibold mb-2">
        Participants ${participants.length > 0 ? `(${participants.length})` : ''}
      </label>

      <div class="bg-white border border-santa-green/30 rounded-lg p-3 focus-within:ring-2 focus-within:ring-santa-gold focus-within:border-transparent">
        <div id="participant-tags" class="flex flex-wrap gap-2 ${participants.length > 0 ? 'mb-3' : ''}">
          ${participants
            .map(
              (name, index) => `
            <span class="participant-tag inline-flex items-center gap-1 px-3 py-1 bg-santa-green text-santa-cream rounded-full text-sm" data-index="${index}">
              <span>${escapeHtml(name)}</span>
              <button type="button" class="remove-participant hover:text-white/70 transition-colors" data-index="${index}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </span>
          `
            )
            .join('')}
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            id="participant-name-input"
            class="flex-1 px-3 py-2 border border-santa-green/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-santa-gold text-santa-bg"
            placeholder="Enter a name..."
          />
          <button
            type="button"
            id="add-participant-btn"
            class="px-4 py-2 bg-santa-gold text-santa-bg font-semibold rounded-lg hover:bg-santa-gold-light transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      ${
        participants.length === 0
          ? '<p class="text-sm text-santa-bg/60 mt-2">Add at least 2 participants to get started</p>'
          : participants.length === 1
            ? '<p class="text-sm text-santa-bg/60 mt-2">Add at least 1 more participant</p>'
            : ''
      }

      <div id="participant-error" class="hidden mt-2 text-sm text-santa-red"></div>
    </div>
  `;

  const input = container.querySelector<HTMLInputElement>('#participant-name-input')!;
  const addBtn = container.querySelector<HTMLButtonElement>('#add-participant-btn')!;
  const errorDiv = container.querySelector<HTMLDivElement>('#participant-error')!;

  function showError(message: string): void {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    input.classList.add('ring-2', 'ring-santa-red');
    setTimeout(() => {
      errorDiv.classList.add('hidden');
      input.classList.remove('ring-2', 'ring-santa-red');
    }, 2000);
  }

  function addParticipant(): void {
    const name = input.value.trim();

    if (!name) {
      showError('Please enter a name');
      return;
    }

    if (participants.includes(name)) {
      showError(`"${name}" is already in the list`);
      input.select();
      return;
    }

    input.value = '';
    input.focus();
    onChange([...participants, name]);
  }

  // Add button click
  addBtn.addEventListener('click', addParticipant);

  // Enter key to add
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addParticipant();
    }
  });

  // Remove buttons
  container.querySelectorAll('.remove-participant').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index!, 10);
      const newParticipants = participants.filter((_, i) => i !== index);
      onChange(newParticipants);
    });
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
