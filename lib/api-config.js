// lib/api-config.js
/**
 * Configuration for API connections to the Node.js server
 */

// Base URL for the Node.js API server
export const API_SERVER_URL = process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://localhost:3001';

// API key for authentication with the Node.js server
export const API_KEY = process.env.RUST_API_KEY || '';

// Socket.io connection options
export const SOCKET_OPTIONS = {
  transports: ['websocket'],
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 10,
};

/**
 * Helper function to build API URLs
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
export function getApiUrl(endpoint) {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_SERVER_URL}${path}`;
}

/**
 * Default request headers for API calls
 * @returns {Object} Headers object with authorization
 */
export function getDefaultHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
  };
}

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {Object} Normalized error object
 */
export function handleApiError(error, context = 'API') {
  console.error(`[${context}] Error:`, error);
  
  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
    status: error.status || 500,
    context
  };
}