import { base64urlEncode, base64urlDecode } from './utils/base64url';
import type { SantaState } from './types';

/**
 * Encode the entire Santa state as a URL-safe base64 string
 */
export function encodeState(state: SantaState): string {
  const encoder = new TextEncoder();
  const json = JSON.stringify(state);
  const data = encoder.encode(json);
  return base64urlEncode(data);
}

/**
 * Decode a state string back to a SantaState object
 */
export function decodeState(encoded: string): SantaState {
  const data = base64urlDecode(encoded);
  const decoder = new TextDecoder();
  const json = decoder.decode(data);
  return JSON.parse(json);
}

/**
 * Validate that a decoded state has the expected structure
 */
export function isValidState(state: unknown): state is SantaState {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Record<string, unknown>;

  if (typeof s.seed !== 'string') return false;
  if (!Array.isArray(s.participants)) return false;
  if (!s.participants.every((p) => typeof p === 'string')) return false;
  if (!Array.isArray(s.constraints)) return false;

  for (const c of s.constraints) {
    if (typeof c !== 'object' || c === null) return false;
    const constraint = c as Record<string, unknown>;
    if (constraint.type !== 'exclude' && constraint.type !== 'must') return false;
    if (typeof constraint.from !== 'string') return false;
    if (typeof constraint.to !== 'string') return false;
  }

  return true;
}

/**
 * Try to decode and validate a state string
 */
export function tryDecodeState(encoded: string): SantaState | null {
  try {
    const state = decodeState(encoded);
    if (isValidState(state)) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}
