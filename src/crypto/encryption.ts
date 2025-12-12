import { base64urlEncode, base64urlDecode } from '../utils/base64url';

export interface AssignmentData {
  giver: string;
  receiver: string;
}

/**
 * Encode an assignment as a URL-safe base64 string
 * The data is obscured but not encrypted - anyone with the link can decode it
 */
export function encodeAssignment(giver: string, receiver: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify({ giver, receiver }));
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
