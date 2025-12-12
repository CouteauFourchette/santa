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
      <div class="flex items-center justify-between mb-2">
        <label class="block text-santa-bg font-semibold">
          Participants ${participants.length > 0 ? `(${participants.length})` : ''}
        </label>
        <button
          type="button"
          id="paste-participants-btn"
          class="text-sm text-santa-green hover:text-santa-green-light transition-colors"
        >
          Paste list
        </button>
      </div>

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

      <!-- Paste Modal -->
      <div id="paste-modal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-santa-cream rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-bold text-santa-bg mb-2">Paste Participant List</h3>
          <p class="text-sm text-santa-bg/60 mb-3">One name per line, or comma-separated</p>
          <textarea
            id="paste-textarea"
            rows="6"
            class="w-full px-3 py-2 border border-santa-green/30 rounded-lg focus:ring-2 focus:ring-santa-gold focus:border-transparent bg-white text-santa-bg resize-none"
            placeholder="Alice&#10;Bob&#10;Charlie&#10;Diana"
          ></textarea>
          <div class="flex gap-2 mt-4">
            <button
              type="button"
              id="paste-cancel-btn"
              class="flex-1 px-4 py-2 border border-santa-green/30 text-santa-bg rounded-lg hover:bg-santa-cream-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="paste-confirm-btn"
              class="flex-1 px-4 py-2 bg-santa-gold text-santa-bg font-semibold rounded-lg hover:bg-santa-gold-light transition-colors"
            >
              Add All
            </button>
          </div>
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
  const pasteBtn = container.querySelector<HTMLButtonElement>('#paste-participants-btn')!;
  const pasteModal = container.querySelector<HTMLDivElement>('#paste-modal')!;
  const pasteTextarea = container.querySelector<HTMLTextAreaElement>('#paste-textarea')!;
  const pasteCancelBtn = container.querySelector<HTMLButtonElement>('#paste-cancel-btn')!;
  const pasteConfirmBtn = container.querySelector<HTMLButtonElement>('#paste-confirm-btn')!;

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

  // Paste modal handlers
  pasteBtn.addEventListener('click', () => {
    pasteTextarea.value = '';
    pasteModal.classList.remove('hidden');
    pasteTextarea.focus();
  });

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
    const names = text
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      return;
    }

    // Add new names, skip duplicates
    const newParticipants = [...participants];
    for (const name of names) {
      if (!newParticipants.includes(name)) {
        newParticipants.push(name);
      }
    }

    pasteModal.classList.add('hidden');
    onChange(newParticipants);
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
