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
let currentNotes: string = '';

function renderOrganizerView(initialState?: SantaState): void {
  // Initialize state from initialState if provided
  if (initialState) {
    currentParticipants = [...initialState.participants];
    currentConstraints = [...initialState.constraints];
    currentSeed = initialState.seed;
    currentNotes = initialState.notes || '';
  } else {
    currentParticipants = [];
    currentConstraints = [];
    currentSeed = '';
    currentNotes = '';
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

          <!-- Notes for Participants -->
          <div class="mb-6">
            <label class="block text-santa-bg font-semibold mb-2" for="notes">
              Note for Participants <span class="font-normal text-santa-bg/60">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows="3"
              class="w-full px-4 py-3 border border-santa-green/30 rounded-lg focus:ring-2 focus:ring-santa-gold focus:border-transparent bg-white text-santa-bg resize-none"
              placeholder="e.g., Budget: $30 max. Exchange date: Dec 24th at 7pm. Location: Mom's house."
            >${escapeHtml(currentNotes)}</textarea>
            <p class="text-sm text-santa-bg/60 mt-2">
              This message will be shown to all participants on their assignment page
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
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-santa-bg">Generated Links</h2>
              <button
                id="export-csv"
                class="px-3 py-1 text-sm text-santa-green hover:text-santa-green-light transition-colors"
              >
                Export CSV
              </button>
            </div>
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
  const notesInput = document.querySelector<HTMLTextAreaElement>('#notes')!;
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

  // Notes input handler
  notesInput.addEventListener('input', (e) => {
    currentNotes = (e.target as HTMLTextAreaElement).value;
  });

  // Generate links handler
  generateLinksBtn.addEventListener('click', () => {
    errorMessage.classList.add('hidden');

    if (currentParticipants.length < 2) {
      errorMessage.textContent = 'Please add at least 2 participants.';
      errorMessage.classList.remove('hidden');
      return;
    }

    // Auto-generate seed if not already set (from loaded state)
    if (!currentSeed) {
      currentSeed = generateRandomSeed();
    }

    try {
      const assignments = generateAssignments(currentParticipants, currentSeed, currentConstraints);
      const notes = notesInput.value.trim();
      currentNotes = notes;
      const links = generateLinks(assignments, BASE_URL, notes || undefined);

      // Generate and display state URL
      const state: SantaState = {
        seed: currentSeed,
        participants: currentParticipants,
        constraints: currentConstraints,
        notes: notes || undefined,
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

      // CSV export handler
      const exportCsvBtn = document.querySelector<HTMLButtonElement>('#export-csv')!;
      exportCsvBtn.addEventListener('click', () => {
        const csvContent = [
          ['Giver', 'Receiver', 'Link'].join(','),
          ...links.map((link) => {
            const assignment = assignments.find((a) => a.giver === link.participant)!;
            return [
              `"${assignment.giver.replace(/"/g, '""')}"`,
              `"${assignment.receiver.replace(/"/g, '""')}"`,
              `"${link.url}"`,
            ].join(',');
          }),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'secret-santa-assignments.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    const notesHtml = assignment.notes
      ? `<div class="mt-6 pt-6 border-t border-santa-green/20">
           <p class="text-santa-bg/60 text-sm mb-2">From the organizer:</p>
           <p class="text-santa-bg whitespace-pre-wrap">${escapeHtml(assignment.notes)}</p>
         </div>`
      : '';

    app.innerHTML = `
      <div class="min-h-screen bg-santa-bg py-8 px-4 flex items-center justify-center">
        <div class="max-w-md w-full">
          <h1 class="text-4xl font-bold text-santa-cream text-center mb-2">'Tis the Season</h1>
          <p class="text-santa-green-light text-center mb-8">Your Secret Santa assignment</p>

          <div class="bg-santa-cream rounded-lg shadow-xl p-8 text-center">
            <div class="w-48 h-48 mx-auto mb-1">
              <!-- Christmas animation based on "Merry Chris-morph!" by Chris Gannon
                   https://codepen.io/chrisgannon/pen/rNGwWdd - MIT License -->
              <svg id="christmasSVG" xmlns="http://www.w3.org/2000/svg" viewBox="150 100 500 400" class="w-full h-full">
                <defs>
                  <filter id="glow" x="-100%" y="-100%" width="250%" height="250%">
                    <feGaussianBlur stdDeviation="12" result="coloredBlur" />
                    <feOffset dx="0" dy="0" result="offsetblur"></feOffset>
                    <feFlood id="glowAlpha" flood-color="#c44536" flood-opacity="0.5"></feFlood>
                    <feComposite in2="offsetblur" operator="in"></feComposite>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"></feMergeNode>
                    </feMerge>
                  </filter>
                  <radialGradient id="redGrad" cx="9" cy="9" r="12" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff"/>
                    <stop offset="1" stop-color="#c44536"/>
                  </radialGradient>
                  <ellipse cx="0" cy="0" class="dot" rx="2" fill="#c44536"/>
                  <g id="pathContainer">
                    <path id="ginger" d="M420.71,229.18a43.2,43.2,0,1,0-49.19,0l-44.69-8.4-8.71,45.31,38.7,7.19v45l-18.6,71.4,44.69,11.7,13.2-51,13.5,51,44.69-11.7-18.6-71.4v-45l38.42-7.19-8.7-45.31Zm-40.19-53.69A7.5,7.5,0,1,1,373,183,7.43,7.43,0,0,1,380.52,175.49Zm31.2,15a7.5,7.5,0,1,1,7.5-7.5A7.43,7.43,0,0,1,411.72,190.49Zm6.9,18a30.52,30.52,0,0,1-45,0,3.21,3.21,0,1,1,5.1-3.9,23.93,23.93,0,0,0,34.8,0,3.33,3.33,0,0,1,4.5-.6,3,3,0,0,1,.6,4.5Zm-22.5,54.6a7.5,7.5,0,1,1,7.5-7.5A7.43,7.43,0,0,1,396.12,263.09Zm0,25.19a7.5,7.5,0,1,1,7.5-7.5A7.43,7.43,0,0,1,396.12,288.28ZM283,236.08a23.18,23.18,0,0,0,18.31,27l7.5,1.5,8.69-45.3-7.5-1.5c-12.6-2.39-24.9,5.71-27,18.3Zm226.19,0a23,23,0,0,0-27-18.3l-7.5,1.5,8.7,45.31,7.5-1.5a23.09,23.09,0,0,0,18.3-27ZM333.71,406.49a23.1,23.1,0,0,0,44.7,11.69l1.8-7.19-44.69-11.7Zm123-7.21L412,411l1.81,7.2a23.1,23.1,0,1,0,44.69-11.7Z" transform="translate(-246.26 -123.64)" fill="#8c6239"/>
                    <path id="gift" d="M505.78,239.07H449.55c16.32-3,32-8.7,38.46-19.43,3-5,7-15.16,1-26.41-6.51-12.05-17.29-12.86-23.8-12.86-17.38,0-37,19-49.59,33.78,6.53-14.51,11.72-32.35,4.9-43.7-3-5-8.68-13-22.84-13.4-13.22-.35-20.77,6.61-24.06,10.84-8.69,11.28-3.54,30.64,3.59,46.93C364.63,200,344.67,180.37,327,180.37c-6.5,0-17.29.79-23.8,12.85-6.07,11.25-2,21.4,1,26.42,6.44,10.72,22.15,16.41,38.46,19.43l-56.19,0a12.88,12.88,0,0,0-12.88,12.88v40.39h245.1V251.93A12.87,12.87,0,0,0,505.78,239.07ZM324.22,206.66c5.24-11.29,30.87,5,43.45,20.21C344.39,225.4,319,217.94,324.22,206.66Zm72.46,13.46c-9.33-18.44-17.1-41.82-.9-41.82S405,204.64,396.68,220.12ZM468,206.66c5.22,11.27-20.18,18.73-43.45,20.21C437.14,211.66,462.78,195.37,468,206.66ZM285.47,304.59H389.26V419.53H298.35a12.87,12.87,0,0,1-12.88-12.88Zm221.29,0V406.65a12.86,12.86,0,0,1-12.87,12.88H403V304.59Z" transform="translate(-246.26 -123.64)"/>
                    <path id="sleigh" d="M551.22,310.3a11.1,11.1,0,0,0-16.55,14.79c12.68,14.21,2.6,37-16.57,37H462.59V339.9h16.78a22.21,22.21,0,0,0,21.27-15.83l24.27-80.92a11.09,11.09,0,0,0-10.62-14.28H486a22.51,22.51,0,0,0-18.27,9.59c-9.34,13-29.54,34.82-60.63,34.82-22.21,0-33.31-22.2-33.31-33.31,0-49.05-50.88-77.72-99.93-77.72h-22.2l40.2,160.82a22.2,22.2,0,0,0,21.54,16.83h4.87v22.2H262.74a11.11,11.11,0,0,0,0,22.21H518.1c38.3,0,58.54-45.58,33.12-74ZM340.46,339.9h99.92v22.2H340.46Z" transform="translate(-246.26 -123.64)" fill="#4a7c59"/>
                    <path id="snowman" d="M396.12,447.34c-96.22,0-87.39-59.92-87.39-116.78,0-43.08,21.43-80.84,53.59-102a55.44,55.44,0,1,1,67.61,0c32.16,21.13,53.59,58.89,53.59,102C483.52,387.42,492.35,447.34,396.12,447.34ZM378.89,156.82c-2.86,0-3.92,2.16-3.92,5s2.75,3.78,5.61,3.78,4.76-.92,4.76-3.78S381.75,156.82,378.89,156.82Zm31.29.67c-3.13,0-7.55,1.9-7.55,4.25s3.29,5.28,6.42,5.28,4.9-2.93,4.9-5.28S413.31,157.49,410.18,157.49Zm22.09,27.45c0,3.41-30.56,8.41-35.94,8.41s-9.74-3.76-9.74-8.41,4.36-8.42,9.74-8.42S432.27,181.93,432.27,184.94Zm-11.5,19.84c-7.09,7.1-15.55,11.22-24.64,11.22-7.64,0-14.84-2.92-21.16-8.08M405.81,277c-1.38-5-6.4-11.27-10.17-10.23s-7,7.62-5.62,12.64,6.87,6.57,10.64,5.53S407.2,282,405.81,277Zm-4.39,43.63c3-4.27,4.61-12.11,1.41-14.36s-10.33-.56-13.32,3.71-.7,9.48,2.5,11.73S398.43,324.89,401.42,320.63Zm-5,26.25c-5.16,0-7.06,3.9-7.06,9.05s5,6.82,10.1,6.82,8.55-1.66,8.55-6.82S401.55,346.88,396.4,346.88Zm5.18,41.17c-5.15-.75-12.89,1.33-13.45,5.2s4.15,9.48,9.3,10.23,8.79-3.64,9.35-7.51S406.73,388.81,401.58,388.05Z" transform="translate(-246.26 -123.64)" fill-rule="evenodd"/>
                    <path id="hat" d="M546,239.05a29.31,29.31,0,0,1-58.62,0,29,29,0,0,1,.28-4l-1.66.12c-9.92-.15-28.28,1.4-38.29,13.27-7.32,8.62-9,20.72-4.32,35.76a96.29,96.29,0,0,0,15.52,31.93A215.45,215.45,0,0,1,391.45,338c-70.69,7.64-116.39-18.19-126.57-24.61.75-14.67,6.52-31.73,17.16-50.48A143.24,143.24,0,0,1,352,199.24c59.74-23.8,119.76,3.89,143.73,17.45a10.32,10.32,0,0,1,.87,1A29.31,29.31,0,0,1,546,239.05Zm-79.5,84.36a217.43,217.43,0,0,1-73.78,24.47,241.5,241.5,0,0,1-27.42,1.5c-57.8-.14-94.69-20.48-105-27.28a33.11,33.11,0,0,0-13.73,20.53,30.16,30.16,0,0,0,4.83,20.67C279.93,398,359.9,396.12,360.7,396.12h1.17c73.31,0,104.62-25.13,105.14-25.36,8.62-6.8,13-14.07,13-21.75C480,337.71,471.18,327.68,466.49,323.41Z" transform="translate(-246.26 -123.64)"/>
                    <path id="bauble" d="M493.41,309a103,103,0,1,1-103-103A103,103,0,0,1,493.41,309ZM488.31,277c-9.92,6.72-12.72,24-27.16,24-17.92,0-17.92-26.65-35.83-26.65S407.4,301,389.5,301s-17.92-26.65-35.83-26.65S335.76,301,317.84,301c-13.69,0-16.91-15.58-25.68-22.91m201.16,34.85c-14.35,3.34-15.56,26.24-32.17,26.24-17.92,0-17.92-26.65-35.83-26.65s-17.92,26.65-35.82,26.65-17.92-26.65-35.83-26.65-17.91,26.65-35.83,26.65c-15.85,0-17.66-20.87-30.3-25.67M349,214.69V186.88a14.29,14.29,0,0,1,14.25-14.25h55.16a14.29,14.29,0,0,1,14.25,14.25v28.19m-27.3-42.44a20.42,20.42,0,1,0-28.22,0" transform="translate(-246.26 -123.64)" fill="none" stroke="#d4a855" stroke-miterlimit="10"/>
                    <path id="train" d="M541.77,184H401.35a4.32,4.32,0,0,0-4.12,4.5v34.7a4.32,4.32,0,0,0,4.12,4.49h10.53v28.77H336.74V209.08h15c1.05,0,1.93-1.32,1.93-3V183.26c0-1.64-.87-3-1.93-3h-65.7c-1.05,0-1.93,1.32-1.93,3V206.1c0,1.64.87,3,1.93,3h15v47.43H284V242.73a3.72,3.72,0,0,0-3.85-3.56h-29.9a3.72,3.72,0,0,0-3.87,3.56V363.66a3.73,3.73,0,0,0,3.87,3.56h9.61a38.53,38.53,0,1,0,76.41-6.8h10.83a39.18,39.18,0,0,0-.64,6.8,38.53,38.53,0,1,0,77.05,0,36.3,36.3,0,0,0-.32-4.68h10.18a36.06,36.06,0,0,0-.32,4.68,38.52,38.52,0,1,0,77,0,40.27,40.27,0,0,0-.3-4.68h21.47V227.72h10.54a4.31,4.31,0,0,0,4.12-4.49v-34.7a4.36,4.36,0,0,0-4.14-4.5Zm-100,107.36V239.18H501.4v52.21Zm-133.5,80.24a9.89,9.89,0,1,1-9.88-9.88A9.88,9.88,0,0,1,308.22,371.63Zm87.15,0a9.89,9.89,0,1,1-9.89-9.88A9.89,9.89,0,0,1,395.37,371.63Zm86.07,0a9.89,9.89,0,1,1-9.88-9.88A9.89,9.89,0,0,1,481.44,371.63Z" transform="translate(-246.26 -123.64)" fill="#d4a855"/>
                    <path id="stocking" d="M492.8,194.68V161.62a3.51,3.51,0,0,0-3.51-3.51H368.66a3.51,3.51,0,0,0-3.5,3.51v33.06a3.51,3.51,0,0,0,3.5,3.51H489.29A3.51,3.51,0,0,0,492.8,194.68ZM373.06,207.11a1.06,1.06,0,0,0-1.06,1.06v76.36a12.16,12.16,0,0,1-6,10.6l-72,43.13a1,1,0,0,0-.22,1.64c11.52,11.72,33,40.74,31,92.39a1.06,1.06,0,0,0,1.36,1.06l96.92-29.57a1,1,0,0,0,.68-1.37,60.81,60.81,0,0,1-3.73-20.89,59.89,59.89,0,0,1,59.81-60h0c1.45,0,3.48,0,5.68.15a1,1,0,0,0,1.12-1.05l.51-112.4a1.06,1.06,0,0,0-1.06-1.06ZM283.88,343.5c-28.88,17.25-26.77,38.16-26.68,39.1a1.46,1.46,0,0,1,0,.51c.47,19.55,6.14,34,17.11,42.8,14.07,11.25,32.82,10.78,40.55,10,3.94-56.76-22.27-84.75-31-92.43Zm202.78-8.11a3.39,3.39,0,0,0,0,.71c.05.33,4.32,33.19-32.48,55.31a90.79,90.79,0,0,1-20.81,9,53.68,53.68,0,0,1-3.66-19.12,50.17,50.17,0,0,1,50.11-50.11c2.11,0,4.45.28,6.8.28v3.94Z" transform="translate(-246.26 -123.64)" fill="#c44536"/>
                    <path id="cane" d="M381.21,455.63a24.11,24.11,0,0,1-15-30.6l64-187.33a39.38,39.38,0,0,0-24.5-49.95A39.79,39.79,0,0,0,358.53,206a24.11,24.11,0,0,1-42.23-23.28,87.55,87.55,0,0,1,159.54,70.55l-64,187.33A24.1,24.1,0,0,1,381.21,455.63Z" transform="translate(-246.26 -123.64)" fill="#c44536"/>
                    <path id="tree" d="M365.49,153.18a5.78,5.78,0,0,1,3.2-10l13.56-1.78a4.1,4.1,0,0,0,3.2-2.15l5-12.14c1.78-4.64,8.19-4.64,10.33,0l5.72,12.49a4.09,4.09,0,0,0,3.2,2.14l13.56,1.43a5.79,5.79,0,0,1,3.2,10l-10,9.28a3.21,3.21,0,0,0-1.07,3.56l2.86,13.56c.72,4.64-4.28,8.55-8.56,6.06l-11.77-6.77a3.88,3.88,0,0,0-3.93,0l-11.77,6.77c-4.28,2.49-9.63-1.42-8.56-6.06L376.54,166a3.41,3.41,0,0,0-1.08-3.56ZM495,382.54a7.13,7.13,0,0,1-3.2,12.12C455,407.14,429.33,407.51,414,405.36l0,52.06a4.87,4.87,0,0,1-5,5H383.65a6.33,6.33,0,0,1-6.06-6.42V405.33c-15.7,2.15-41,1.79-77.76-10.7a7.28,7.28,0,0,1-2.49-12.12c15-14.26,28.17-27.81,39.23-40.65a226.19,226.19,0,0,1-24.6-7.14,7.21,7.21,0,0,1-2.86-12.12,445.39,445.39,0,0,0,43.17-46q-7.48-1.6-16.06-4.27c-5-1.79-6.78-8.56-2.85-12.13,25.33-24.25,41.38-46.37,51-61.71q.36-.72.72-1.38a12.25,12.25,0,0,1,20.68-1.34c.69,1,1.41,2,2.15,3.09a339,339,0,0,0,51,61.37,7.22,7.22,0,0,1-2.85,12.12Q447.49,275,440,276.62a544,544,0,0,0,43.16,46c3.92,3.56,2.5,10.34-2.85,12.12a225.47,225.47,0,0,1-24.61,7.13A510.71,510.71,0,0,0,495,382.54Z" transform="translate(-246.26 -123.64)" fill="#4a7c59"/>
                  </g>
                </defs>
                <g id="container" filter="url(#glow)"/>
              </svg>
            </div>
            <p class="text-santa-bg/70 mb-2">Hey <span class="font-semibold text-santa-bg">${escapeHtml(assignment.giver)}</span>!</p>
            <p class="text-xl text-santa-bg mb-4">You're giving a gift to:</p>
            <p class="text-5xl font-bold text-santa-red">${escapeHtml(assignment.receiver)}</p>
            ${notesHtml}
          </div>
        </div>
      </div>
    `;

    // Initialize the Christmas animation
    initChristmasAnimation();
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

// Declare GSAP types for TypeScript
declare const gsap: {
  set: (target: unknown, vars: object) => void;
  to: (target: unknown, vars: object) => { seek: (time: number) => void };
  delayedCall: (delay: number, callback: () => void) => void;
  registerPlugin: (...plugins: unknown[]) => void;
};

declare const MotionPathPlugin: {
  getRawPath: (target: unknown) => unknown;
  cacheRawPathMeasurements: (rawPath: unknown) => void;
  getPositionOnPath: (rawPath: unknown, progress: number, includeAngle: boolean) => { x: number; y: number };
};

function initChristmasAnimation(): void {
  const container = document.querySelector('#container');
  const dot = document.querySelector('.dot');

  if (!container || !dot || typeof gsap === 'undefined' || typeof MotionPathPlugin === 'undefined') {
    return;
  }

  gsap.registerPlugin(MotionPathPlugin);

  const maxDots = 250;
  const allDotsArr: SVGElement[] = [];
  const allShapesArr: Array<Array<{ data: { x: number; y: number }; index: number }>> = [];
  const allPathsArr = Array.from(document.querySelectorAll('#pathContainer path')).reverse();
  let shapeDataCount = -1;
  const allColors = ['url(#redGrad)', '#FFF'];

  gsap.set('#christmasSVG', { visibility: 'visible' });

  const setShape = (shapeData: Array<{ data: { x: number; y: number }; index: number }>) => {
    gsap.to(allDotsArr, {
      stagger: { each: 0.0071 },
      x: (index: number) => shapeData[index].data.x,
      y: (index: number) => shapeData[index].data.y,
      ease: 'sine.inOut',
      duration: 1
    });
  };

  for (let i = 0; i < maxDots; i++) {
    const clone = dot.cloneNode(true) as SVGElement;
    container.appendChild(clone);
    allDotsArr.push(clone);
    gsap.set(clone, {
      fill: allColors[i % allColors.length],
      x: 400,
      y: 300,
      attr: { rx: [4, 2][i % 2] },
      transformOrigin: '50% 50%'
    });
  }

  allPathsArr.forEach((path, count) => {
    const rawPath = MotionPathPlugin.getRawPath(path);
    MotionPathPlugin.cacheRawPathMeasurements(rawPath);
    const shapeArr: Array<{ data: { x: number; y: number }; index: number }> = [];
    allShapesArr.push(shapeArr);
    for (let i = 0; i < maxDots; i++) {
      allShapesArr[count].push({
        data: MotionPathPlugin.getPositionOnPath(rawPath, i / maxDots, true),
        index: i
      });
    }
  });

  const make = () => {
    shapeDataCount = shapeDataCount < allShapesArr.length - 1 ? shapeDataCount + 1 : 0;
    setShape(allShapesArr[shapeDataCount]);
    gsap.delayedCall(4, make); // Pause longer on each shape
  };
  make();

  gsap.to(allDotsArr, {
    attr: { rx: '+=4' },
    ease: 'linear',
    stagger: {
      each: 0.01,
      repeat: -1,
      yoyo: true,
    },
    duration: 0.25
  }).seek(100);
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
