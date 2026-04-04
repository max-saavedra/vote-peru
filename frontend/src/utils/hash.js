/**
 * Client-side email hashing so the raw email never leaves the browser
 * in a way that could be logged in transit. The same SHA-256 hash is
 * computed on the backend for the deduplication check.
 */

import { sha256 } from 'js-sha256'

/**
 * Hash an email address for deduplication.
 * Normalizes to lowercase and trims whitespace before hashing.
 * @param {string} email
 * @returns {string} hex SHA-256 digest
 */
export function hashEmail(email) {
  return sha256(email.trim().toLowerCase())
}
