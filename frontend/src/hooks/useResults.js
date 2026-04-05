/**
 * useResults hook: fetches results from the API and polls every 30 seconds.
 * Returns { data, loading, error, refresh }.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchResults } from '../utils/api.js'

const POLL_INTERVAL_MS = 30_000

export function useResults() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const load = useCallback(async () => {
    try {
      console.log(" [Hook] Iniciando petición a fetchResults()...");
      const results = await fetchResults()
      console.log(" [Hook] Respuesta cruda del API:", results);
      setData(results)
      setError(null)
    } catch (err) {
      console.error(" [Hook] Fallo en la petición:", err);
      setError('No se pudo conectar al servidor. Reintentando...')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [load])

  return { data, loading, error, refresh: load }
}
