/**
 * VotePage: multi-step voting flow.
 * Step 0: Sign in with Google (Supabase)
 * Step 1: select candidate
 * Step 2: enter optional demographics
 * Step 3: confirmation / result
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CandidateCard from '../components/CandidateCard.jsx'
import { fetchCandidates, submitVote } from '../utils/api.js'
import { supabase } from '../utils/supabase.js'
import './VotePage.css'

const CITIES = [
  'Lima', 'Callao', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura',
  'Cusco', 'Huancayo', 'Iquitos', 'Chimbote', 'Pucallpa', 'Tacna',
  'Cajamarca', 'Ica', 'Juliaca', 'Puno', 'Ayacucho', 'Huaraz',
  'Tarapoto', 'Puerto Maldonado', 'Huánuco', 'Abancay',
  'Moyobamba', 'Chachapoyas', 'Tumbes',
]

const initialForm = {
  age_range: '',
  sex: '',
  nse: '',
  city: '',
  region: '',
  location_type: '',
}

export default function VotePage() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: select, 2: form, 3: done
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { success, message, already_voted }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchCandidates()
        .then(setCandidates)
        .finally(() => setLoading(false))
    }
  }, [session])

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/votar'
      }
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStep(1)
    setSelectedId(null)
  }

  const selectedCandidate = candidates.find(c => c.id === selectedId)

  function handleSelect(id) {
    setSelectedId(id)
  }

  function handleContinue() {
    if (!selectedId) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleFormChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const token = session?.access_token
      console.log("🚀 Enviando voto con Token:", token?.substring(0, 20) + "...");
      const payload = {
        candidate_id: selectedId,
        age_range: form.age_range || undefined,
        sex: form.sex || undefined,
        nse: form.nse || undefined,
        city: form.city || undefined,
        region: form.region || undefined,
        location_type: form.location_type || undefined,
      }
      //const token = session.access_token
      const res = await submitVote(payload, token)
      console.log("✅ Respuesta del servidor:", res);
      setResult(res)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error("❌ Error 401/405 detectado:", {
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers
      });
      const msg = err.response?.data?.detail || 'Error al registrar el voto. Intenta de nuevo.'
      setResult({ success: false, message: msg })
      setStep(3)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="vote-page container">
        <div className="loading-state">Verificando sesión...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="vote-page container fade-in auth-container">
        <div className="page-header" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h1>Inicia sesión para votar</h1>
          <p className="page-subtitle">
            Para garantizar que cada persona vote una sola vez, requerimos autenticación con Google.
            Tu identidad permanecerá anónima para el voto.
          </p>
          <button onClick={handleGoogleSignIn} className="btn btn-primary" style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="vote-page container">
        <div className="loading-state">Cargando candidatos...</div>
      </div>
    )
  }

  return (
    <div className="vote-page container">
      {/* Session header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 0' }}>
        <span style={{ marginRight: '1rem', alignSelf: 'center' }}>Sesión iniciada</span>
        <button onClick={handleSignOut} className="btn btn-secondary btn-sm">Cerrar Sesión</button>
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="steps">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>
      )}

      {/* STEP 1: Select candidate */}
      {step === 1 && (
        <div className="fade-in">
          <div className="page-header">
            <h1>Selecciona tu candidato</h1>
            <p className="page-subtitle">
              Elige al candidato que votarías en las elecciones del 12 de abril de 2026.
              Puedes desplazarte para ver todos los candidatos.
            </p>
          </div>

          <div className="candidates-grid">
            {candidates.map(c => (
              <CandidateCard
                key={c.id}
                candidate={c}
                selected={selectedId === c.id}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {selectedId && (
            <div className="selection-bar">
              <div className="selection-info">
                <img
                  src={selectedCandidate?.photo}
                  alt={selectedCandidate?.name}
                  className="selection-photo"
                  onError={e => { e.target.style.display = 'none' }}
                />
                <span>
                  Seleccionaste a <strong>{selectedCandidate?.name}</strong>
                  {' '}· {selectedCandidate?.party}
                </span>
              </div>
              <button className="btn btn-primary" onClick={handleContinue}>
                Continuar
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Demographics */}
      {step === 2 && (
        <div className="fade-in form-step">
          <div className="page-header">
            <h1>Completa tu registro</h1>
            <p className="page-subtitle">
              Los siguientes datos demográficos son opcionales y no comprometen tu privacidad.
            </p>
          </div>

          {/* Selected candidate summary */}
          <div className="selected-summary card">
            <img
              src={selectedCandidate?.photo}
              alt={selectedCandidate?.name}
              className="summary-photo"
              onError={e => { e.target.style.display = 'none' }}
            />
            <div>
              <p className="summary-label">Tu candidato seleccionado</p>
              <p className="summary-name">{selectedCandidate?.name}</p>
              <p className="summary-party">{selectedCandidate?.party}</p>
            </div>
            <button
              className="btn btn-secondary btn-sm change-btn"
              onClick={() => setStep(1)}
            >
              Cambiar
            </button>
          </div>

          {/* Demographics - all optional */}
          <div className="form-section">
            <h2 className="section-title">Datos demográficos <span className="optional-tag">Opcional</span></h2>
            <p className="section-hint">
              Estos datos enriquecen los gráficos de análisis. Estarán anonimizados.
            </p>

            <div className="demographics-grid">
              {/* Age */}
              <div className="field-group">
                <label className="field-label">Rango de edad</label>
                <select
                  className="input"
                  value={form.age_range}
                  onChange={e => handleFormChange('age_range', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(r => (
                    <option key={r} value={r}>{r} años</option>
                  ))}
                </select>
              </div>

              {/* Sex */}
              <div className="field-group">
                <label className="field-label">Sexo</label>
                <select
                  className="input"
                  value={form.sex}
                  onChange={e => handleFormChange('sex', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                  <option value="prefiero_no_decir">Prefiero no decir</option>
                </select>
              </div>

              {/* NSE */}
              <div className="field-group">
                <label className="field-label">Nivel socioeconómico (NSE)</label>
                <select
                  className="input"
                  value={form.nse}
                  onChange={e => handleFormChange('nse', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="A">NSE A — Clase alta (ingresos {'>'} S/ 12,600/mes)</option>
                  <option value="B">NSE B — Clase media alta (~S/ 6,200/mes)</option>
                  <option value="C">NSE C — Clase media típica</option>
                  <option value="D">NSE D — Clase media baja / vulnerable</option>
                  <option value="E">NSE E — Clase baja / pobreza</option>
                </select>
              </div>

              {/* Location type */}
              <div className="field-group">
                <label className="field-label">¿Dónde votarías?</label>
                <select
                  className="input"
                  value={form.location_type}
                  onChange={e => handleFormChange('location_type', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="peru">Dentro del Perú</option>
                  <option value="extranjero">Desde el extranjero</option>
                </select>
              </div>

              {/* Region */}
              <div className="field-group">
                <label className="field-label">Región natural</label>
                <select
                  className="input"
                  value={form.region}
                  onChange={e => handleFormChange('region', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="costa">Costa</option>
                  <option value="sierra">Sierra</option>
                  <option value="selva">Selva</option>
                </select>
              </div>

              {/* City */}
              <div className="field-group">
                <label className="field-label">Ciudad</label>
                <select
                  className="input"
                  value={form.city}
                  onChange={e => handleFormChange('city', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Otra">Otra ciudad</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              Volver
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Registrando...' : 'Registrar mi voto'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirmation */}
      {step === 3 && result && (
        <div className="fade-in confirmation">
          {result.success ? (
            <>
              <div className="confirm-icon success">✓</div>
              <h1>¡Voto registrado!</h1>
              <p className="confirm-msg">{result.message}</p>
            </>
          ) : result.already_voted ? (
            <>
              <div className="confirm-icon warning">!</div>
              <h1>Ya registraste un voto</h1>
              <p className="confirm-msg">{result.message}</p>
            </>
          ) : (
            <>
              <div className="confirm-icon error">✕</div>
              <h1>Algo salió mal</h1>
              <p className="confirm-msg">{result.message}</p>
            </>
          )}

          <div className="confirm-actions">
            <Link to="/resultados" className="btn btn-primary">
              Ver resultados en tiempo real
            </Link>
            <Link to="/" className="btn btn-secondary">
              Volver al inicio
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
