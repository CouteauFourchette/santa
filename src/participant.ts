import { decodeAssignment, type AssignmentData } from './crypto/encryption';

/**
 * Get the encoded data from URL parameters
 */
export function getEncodedDataFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('d');
}

/**
 * Decode and return the assignment data from the URL
 */
export function revealAssignment(encodedData: string): AssignmentData {
  try {
    return decodeAssignment(encodedData);
  } catch {
    throw new Error('Invalid link. The assignment data could not be decoded.');
  }
}
