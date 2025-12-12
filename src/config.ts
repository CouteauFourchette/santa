/**
 * Base URL for the application
 * In development: uses current origin (works with any port)
 * In production: uses GitHub Pages URL
 */
const PROD_URL = 'https://couteaufourchette.github.io/santa/';

export const BASE_URL = import.meta.env.DEV
  ? `${window.location.origin}/`
  : PROD_URL;
