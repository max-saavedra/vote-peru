/**
 * API service: all communication with the FastAPI backend.
 * Base URL is read from Vite env variable; falls back to same origin.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Submit a vote to the backend.
 * @param {Object} voteData - candidate_id, email, demographics, recaptcha_token
 */
export async function submitVote(voteData, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await api.post('/votes', voteData, { headers });
  return res.data
}

/**
 * Fetch all aggregated results for the dashboard.
 */
export async function fetchResults() {
  const res = await api.get('/api/results/')
  return res.data
}

/**
 * Fetch the static candidate list from the backend.
 */
export async function fetchCandidates() {
  const res = await api.get('/results/candidates')
  return res.data
}

/**
 * Check if an email hash has already voted.
 * @param {string} emailHash - SHA-256 hex hash of the email
 */
export async function checkVoted(emailHash) {
  const res = await api.get(`/votes/check/${emailHash}`)
  return res.data.voted
}
