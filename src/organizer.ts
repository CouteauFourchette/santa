import { hashSeed, createSeededRandom } from './crypto/seededRandom';
import { seededShuffle } from './crypto/shuffle';
import { encodeAssignment } from './crypto/encryption';
import type { Assignment, GeneratedLink, Constraint } from './types';

/**
 * Check if an assignment is valid given constraints
 */
function isValidAssignment(
  giver: string,
  receiver: string,
  constraints: Constraint[]
): boolean {
  // Can't give to yourself
  if (giver === receiver) return false;

  for (const c of constraints) {
    if (c.type === 'exclude' && c.from === giver && c.to === receiver) {
      return false;
    }
  }
  return true;
}

/**
 * Generate Secret Santa assignments with constraints using backtracking
 */
export function generateAssignments(
  participants: string[],
  seedString: string,
  constraints: Constraint[] = []
): Assignment[] {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants');
  }

  const numericSeed = hashSeed(seedString);
  const random = createSeededRandom(numericSeed);

  // Build must-match constraints map
  const mustMatch = new Map<string, string>();
  for (const c of constraints) {
    if (c.type === 'must') {
      if (mustMatch.has(c.from)) {
        throw new Error(`${c.from} has multiple must-match constraints`);
      }
      mustMatch.set(c.from, c.to);
    }
  }

  // Check that must-match targets are valid participants
  for (const [from, to] of mustMatch) {
    if (!participants.includes(from)) {
      throw new Error(`Must-match constraint references unknown participant: ${from}`);
    }
    if (!participants.includes(to)) {
      throw new Error(`Must-match constraint references unknown participant: ${to}`);
    }
    if (from === to) {
      throw new Error(`${from} cannot be required to gift themselves`);
    }
  }

  // Check that no one is receiving from multiple must-match givers
  const mustReceive = new Map<string, string>();
  for (const [from, to] of mustMatch) {
    if (mustReceive.has(to)) {
      throw new Error(`${to} is the must-match target of multiple people`);
    }
    mustReceive.set(to, from);
  }

  // Try to find valid assignments with backtracking
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffledReceivers = seededShuffle([...participants], random);
    const assignments: Assignment[] = [];
    const usedReceivers = new Set<string>();
    let valid = true;

    // First, handle must-match constraints
    for (const [, receiver] of mustMatch) {
      if (usedReceivers.has(receiver)) {
        valid = false;
        break;
      }
      usedReceivers.add(receiver);
    }

    if (!valid) continue;

    // Assign each participant
    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];

      // If this giver has a must-match, use it
      if (mustMatch.has(giver)) {
        const receiver = mustMatch.get(giver)!;
        assignments.push({ giver, receiver, index: i });
        continue;
      }

      // Find a valid receiver from shuffled list
      let foundReceiver = false;
      for (const potentialReceiver of shuffledReceivers) {
        if (usedReceivers.has(potentialReceiver)) continue;
        if (!isValidAssignment(giver, potentialReceiver, constraints)) continue;

        assignments.push({ giver, receiver: potentialReceiver, index: i });
        usedReceivers.add(potentialReceiver);
        foundReceiver = true;
        break;
      }

      if (!foundReceiver) {
        valid = false;
        break;
      }
    }

    if (valid && assignments.length === participants.length) {
      // Verify everyone receives exactly one gift
      const receivers = new Set(assignments.map((a) => a.receiver));
      if (receivers.size === participants.length) {
        return assignments;
      }
    }
  }

  throw new Error(
    'Could not find valid assignments with the given constraints. Try removing some constraints.'
  );
}

/**
 * Generate links for all participants
 */
export function generateLinks(
  assignments: Assignment[],
  baseUrl: string
): GeneratedLink[] {
  return assignments.map((assignment) => {
    const encodedData = encodeAssignment(assignment.giver, assignment.receiver);
    const url = `${baseUrl}?d=${encodedData}`;

    return {
      participant: assignment.giver,
      url,
      encodedData,
    };
  });
}

/**
 * Parse participant names from textarea input
 * Supports comma-separated or newline-separated names
 */
export function parseParticipants(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * Parse constraints from textarea input
 * Format: "Alice !-> Bob" (Alice cannot gift Bob)
 *         "Alice -> Bob" (Alice must gift Bob)
 */
export function parseConstraints(
  input: string,
  participants: string[]
): Constraint[] {
  const constraints: Constraint[] = [];
  const lines = input.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (const line of lines) {
    // Must-match: "Alice -> Bob"
    const mustMatch = line.match(/^(.+?)\s*->\s*(.+)$/);
    if (mustMatch && !line.includes('!')) {
      const from = mustMatch[1].trim();
      const to = mustMatch[2].trim();
      if (participants.includes(from) && participants.includes(to)) {
        constraints.push({ type: 'must', from, to });
      }
      continue;
    }

    // Exclusion: "Alice !-> Bob" or "Alice !> Bob"
    const exclude = line.match(/^(.+?)\s*!-?>\s*(.+)$/);
    if (exclude) {
      const from = exclude[1].trim();
      const to = exclude[2].trim();
      if (participants.includes(from) && participants.includes(to)) {
        constraints.push({ type: 'exclude', from, to });
      }
      continue;
    }
  }

  return constraints;
}

/**
 * Generate a random seed phrase
 */
export function generateRandomSeed(): string {
  const words = [
    'snowflake',
    'reindeer',
    'chimney',
    'mistletoe',
    'jingle',
    'sleigh',
    'carol',
    'frost',
    'cocoa',
    'holly',
    'tinsel',
    'candy',
    'gingerbread',
    'nutcracker',
    'ornament',
    'wreath',
  ];
  const randomWords = [];
  for (let i = 0; i < 3; i++) {
    const index = Math.floor(Math.random() * words.length);
    randomWords.push(words[index]);
  }
  const randomNum = Math.floor(Math.random() * 100);
  return `${randomWords.join('-')}-${randomNum}`;
}

/**
 * Format constraints back to string for display
 */
export function formatConstraints(constraints: Constraint[]): string {
  return constraints
    .map((c) => {
      if (c.type === 'must') {
        return `${c.from} -> ${c.to}`;
      } else {
        return `${c.from} !-> ${c.to}`;
      }
    })
    .join('\n');
}
