// Central place for environment-specific settings.
// Swapping from mock server to Group 1's real engine later
// should only ever require changing VITE_API_BASE_URL.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';