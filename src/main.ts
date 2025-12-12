import './style.css';
import { generateAssignments, generateLinks, generateRandomSeed } from './organizer';
import { revealAssignment } from './participant';
import { encodeState, tryDecodeState } from './state';
import { BASE_URL } from './config';
import { renderParticipantInput } from './components/ParticipantInput';
import { renderConstraintBuilder } from './components/ConstraintBuilder';
import type { SantaState, Constraint } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Application state
let currentParticipants: string[] = [];
let currentConstraints: Constraint[] = [];
let currentSeed: string = '';

function renderOrganizerView(initialState?: SantaState): void {
  // Initialize state from initialState if provided
  if (initialState) {
    currentParticipants = [...initialState.participants];
    currentConstraints = [...initialState.constraints];
    currentSeed = initialState.seed;
  } else {
    currentParticipants = [];
    currentConstraints = [];
    currentSeed = '';
  }

  app.innerHTML = `
    <div class="min-h-screen bg-santa-bg py-8 px-4">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-4xl font-bold text-santa-cream text-center mb-2">'Tis the Season</h1>
        <p class="text-santa-green-light text-center mb-8">Create your Secret Santa gift exchange</p>

        <div class="bg-santa-cream rounded-lg shadow-xl p-6 mb-6">
          <!-- Participant Input Component -->
          <div id="participant-input-container" class="mb-6"></div>

          <!-- Constraint Builder Component -->
          <div id="constraint-builder-container" class="mb-6"></div>

          <!-- Seed Input -->
          <div class="mb-6">
            <label class="block text-santa-bg font-semibold mb-2" for="seed">
              Secret Seed
            </label>
            <div class="flex gap-2">
              <input
                id="seed"
                type="text"
                class="flex-1 px-4 py-3 border border-santa-green/30 rounded-lg focus:ring-2 focus:ring-santa-gold focus:border-transparent bg-white text-santa-bg"
                placeholder="Enter a memorable phrase..."
                value="${escapeHtml(currentSeed)}"
              />
              <button
                id="generate-seed"
                type="button"
                class="px-4 py-3 bg-santa-cream-dark text-santa-bg rounded-lg hover:bg-santa-gold-light transition-colors"
              >
                Random
              </button>
            </div>
            <p class="text-sm text-santa-bg/60 mt-2">
              Same seed + participants + constraints = same assignments
            </p>
          </div>

          <button
            id="generate-links"
            type="button"
            class="w-full py-3 bg-santa-red text-santa-cream font-semibold rounded-lg hover:bg-santa-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Links
          </button>

          <div id="error-message" class="hidden mt-4 p-4 bg-santa-red/10 text-santa-red rounded-lg"></div>
        </div>

        <div id="results" class="hidden space-y-6">
          <!-- Save State Section -->
          <div class="bg-santa-cream rounded-lg shadow-xl p-6">
            <h2 class="text-xl font-bold text-santa-bg mb-3">Save Your Setup</h2>
            <p class="text-santa-bg/70 mb-3 text-sm">
              Bookmark or save this link to regenerate the same assignments later:
            </p>
            <div class="flex gap-2">
              <input
                id="state-url"
                type="text"
                readonly
                class="flex-1 px-3 py-2 bg-white border border-santa-green/20 rounded font-mono text-sm text-santa-bg/70 truncate"
              />
              <button
                id="copy-state"
                class="px-4 py-2 bg-santa-gold text-santa-bg text-sm font-semibold rounded hover:bg-santa-gold-light transition-colors whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <a
              id="state-link"
              href="#"
              class="inline-block mt-2 text-santa-green hover:text-santa-green-light text-sm underline"
              target="_blank"
            >
              Open in new tab
            </a>
          </div>

          <!-- Generated Links Section -->
          <div class="bg-santa-cream rounded-lg shadow-xl p-6">
            <h2 class="text-2xl font-bold text-santa-bg mb-4">Generated Links</h2>
            <p class="text-santa-bg/70 mb-4">
              Send each person their personal link. They'll see their assignment immediately!
            </p>
            <div id="links-list" class="space-y-3"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const participantContainer = document.querySelector<HTMLDivElement>('#participant-input-container')!;
  const constraintContainer = document.querySelector<HTMLDivElement>('#constraint-builder-container')!;
  const seedInput = document.querySelector<HTMLInputElement>('#seed')!;
  const generateSeedBtn = document.querySelector<HTMLButtonElement>('#generate-seed')!;
  const generateLinksBtn = document.querySelector<HTMLButtonElement>('#generate-links')!;
  const errorMessage = document.querySelector<HTMLDivElement>('#error-message')!;
  const resultsDiv = document.querySelector<HTMLDivElement>('#results')!;
  const linksList = document.querySelector<HTMLDivElement>('#links-list')!;
  const stateUrlInput = document.querySelector<HTMLInputElement>('#state-url')!;
  const stateLinkAnchor = document.querySelector<HTMLAnchorElement>('#state-link')!;
  const copyStateBtn = document.querySelector<HTMLButtonElement>('#copy-state')!;

  // Render participant input
  function updateParticipantInput(): void {
    renderParticipantInput(participantContainer, {
      participants: currentParticipants,
      onChange: (newParticipants) => {
        currentParticipants = newParticipants;
        updateParticipantInput();
        updateConstraintBuilder();
      },
    });
  }

  // Render constraint builder
  function updateConstraintBuilder(): void {
    renderConstraintBuilder(constraintContainer, {
      participants: currentParticipants,
      constraints: currentConstraints,
      onChange: (newConstraints) => {
        currentConstraints = newConstraints;
        updateConstraintBuilder();
      },
    });
  }

  // Initial render of components
  updateParticipantInput();
  updateConstraintBuilder();

  // Seed input handlers
  seedInput.addEventListener('input', (e) => {
    currentSeed = (e.target as HTMLInputElement).value;
  });

  generateSeedBtn.addEventListener('click', () => {
    currentSeed = generateRandomSeed();
    seedInput.value = currentSeed;
  });

  // Generate links handler
  generateLinksBtn.addEventListener('click', () => {
    const seed = seedInput.value.trim();
    currentSeed = seed;

    errorMessage.classList.add('hidden');

    if (currentParticipants.length < 2) {
      errorMessage.textContent = 'Please add at least 2 participants.';
      errorMessage.classList.remove('hidden');
      return;
    }

    if (!seed) {
      errorMessage.textContent = 'Please enter a seed phrase.';
      errorMessage.classList.remove('hidden');
      return;
    }

    try {
      const assignments = generateAssignments(currentParticipants, seed, currentConstraints);
      const links = generateLinks(assignments, BASE_URL);

      // Generate and display state URL
      const state: SantaState = {
        seed,
        participants: currentParticipants,
        constraints: currentConstraints,
      };
      const stateCode = encodeState(state);
      const stateUrl = `${BASE_URL}?state=${stateCode}`;
      stateUrlInput.value = stateUrl;
      stateLinkAnchor.href = stateUrl;

      linksList.innerHTML = links
        .map(
          (link) => `
        <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-santa-green/10">
          <span class="font-medium text-santa-bg min-w-[120px]">${escapeHtml(link.participant)}</span>
          <input
            type="text"
            readonly
            value="${escapeHtml(link.url)}"
            class="flex-1 px-3 py-2 bg-santa-cream-dark border border-santa-green/20 rounded text-sm text-santa-bg/70"
          />
          <button
            class="copy-btn px-3 py-2 bg-santa-green text-santa-cream text-sm rounded hover:bg-santa-green-light transition-colors"
            data-url="${escapeHtml(link.url)}"
          >
            Copy
          </button>
        </div>
      `
        )
        .join('');

      resultsDiv.classList.remove('hidden');

      // Scroll to results
      resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Add copy button handlers for links
      linksList.querySelectorAll('.copy-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const button = e.target as HTMLButtonElement;
          const url = button.dataset.url!;
          await navigator.clipboard.writeText(url);
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 2000);
        });
      });
    } catch (err) {
      errorMessage.textContent = err instanceof Error ? err.message : 'An error occurred';
      errorMessage.classList.remove('hidden');
    }
  });

  // Copy state URL button handler
  copyStateBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(stateUrlInput.value);
    copyStateBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyStateBtn.textContent = 'Copy';
    }, 2000);
  });
}

function renderParticipantView(encodedData: string): void {
  try {
    const assignment = revealAssignment(encodedData);

    app.innerHTML = `
      <div class="min-h-screen bg-santa-bg py-8 px-4 flex items-center justify-center">
        <div class="max-w-md w-full">
          <h1 class="text-4xl font-bold text-santa-cream text-center mb-2">'Tis the Season</h1>
          <p class="text-santa-green-light text-center mb-8">Your Secret Santa assignment</p>

          <div class="bg-santa-cream rounded-lg shadow-xl p-8 text-center">
            <div class="text-6xl mb-4">🎁</div>
            <p class="text-santa-bg/70 mb-2">Hey <span class="font-semibold text-santa-bg">${escapeHtml(assignment.giver)}</span>!</p>
            <p class="text-xl text-santa-bg mb-4">You're giving a gift to:</p>
            <p class="text-3xl font-bold text-santa-red">${escapeHtml(assignment.receiver)}</p>
          </div>
        </div>
      </div>
    `;
  } catch {
    app.innerHTML = `
      <div class="min-h-screen bg-santa-bg py-8 px-4 flex items-center justify-center">
        <div class="max-w-md w-full">
          <h1 class="text-4xl font-bold text-santa-cream text-center mb-2">'Tis the Season</h1>
          <p class="text-santa-green-light text-center mb-8">Oops!</p>

          <div class="bg-santa-cream rounded-lg shadow-xl p-8 text-center">
            <div class="text-6xl mb-4">😕</div>
            <p class="text-santa-bg mb-4">This link appears to be invalid or corrupted.</p>
            <p class="text-santa-bg/60">Please ask the organizer for a new link.</p>
          </div>
        </div>
      </div>
    `;
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Router: check URL params to determine which view to show
function init(): void {
  const params = new URLSearchParams(window.location.search);
  const encodedData = params.get('d');
  const stateCode = params.get('state');

  if (encodedData) {
    // Participant view - show their assignment
    renderParticipantView(encodedData);
  } else if (stateCode) {
    // Organizer view with pre-loaded state
    const state = tryDecodeState(stateCode);
    renderOrganizerView(state ?? undefined);
  } else {
    // Fresh organizer view
    renderOrganizerView();
  }
}

init();
