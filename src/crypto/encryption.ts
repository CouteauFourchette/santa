import { base64urlEncode, base64urlDecode } from '../utils/base64url';

export interface AssignmentData {
  giver: string;
  receiver: string;
  notes?: string;
  theme?: string;
  snowEnabled?: boolean;
}

/**
 * Encode an assignment as a URL-safe base64 string
 * The data is obscured but not encrypted - anyone with the link can decode it
 */
export function encodeAssignment(
  giver: string,
  receiver: string,
  options?: { notes?: string; theme?: string; snowEnabled?: boolean }
): string {
  const encoder = new TextEncoder();
  const payload: AssignmentData = { giver, receiver };
  if (options?.notes) {
    payload.notes = options.notes;
  }
  if (options?.theme) {
    payload.theme = options.theme;
  }
  if (options?.snowEnabled !== undefined) {
    payload.snowEnabled = options.snowEnabled;
  }
  const data = encoder.encode(JSON.stringify(payload));
  return base64urlEncode(data);
}

/**
 * Decode an assignment from a URL-safe base64 string
 */
export function decodeAssignment(encodedData: string): AssignmentData {
  const data = base64urlDecode(encodedData);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(data));
}
