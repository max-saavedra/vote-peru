/**
 * ResultsPage: full real-time dashboard with all charts.
 * Polls the API every 30 seconds for updated results.
 */

import { Link } from 'react-router-dom'
import { useResults } from '../hooks/useResults.js'
import RankingChart from '../components/charts/RankingChart.jsx'
import DemographicCharts from '../components/charts/DemographicCharts.jsx'
import TrendChart from '../components/charts/TrendChart.jsx'
import './ResultsPage.css'

export default function ResultsPage() {
  const { data, loading, error, refresh } = useResults()

  // --- LOGS DE DEPURACIÓN ---
  useEffect(() => {
    if (data) {
      console.log(" [Frontend] Datos recibidos del API:", data);
      console.log(" [Frontend] Total Votos:", data.total_votes);
    }
    if (error) {
      console.error(" [Frontend] Error en el hook useResults:", error);
    }
  }, [data, error]);
  // ---------------------------

  if (loading) {
    return (
      <div className="results-page container">
        <div className="results-loading">
          <div className="spinner" />
          <p>Cargando resultados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="results-page container">
        <div className="results-error">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={refresh}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="results-page container">
      {/* Header */}
      <div className="results-header">
        <div>
          <h1>Tendencias en tiempo real</h1>
          <p className="results-subtitle">
            Intenciones de voto presidencial — Elecciones Perú 2026
          </p>
        </div>
        <div className="results-meta">
          <div className="total-votes">
            <span className="total-number">{(data?.total_votes || 0).toLocaleString('es-PE')}</span>
            <span className="total-label">registros totales</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={refresh}>
            ↻ Actualizar
          </button>
          <Link to="/votar" className="btn btn-primary btn-sm">
            Registrar mi voto
          </Link>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="disclaimer-banner">
        <strong>Aviso importante:</strong> Este sondeo no es oficial ni representativo.
        Refleja la tendencia dentro de los usuarios de esta plataforma y no debe
        interpretarse como predicción electoral, encuesta científica ni manipulación pública.
      </div>

      {/* No votes yet */}
      {(data?.total_votes === 0 || !data) && (
        <div className="no-votes card">
          <p>Aún no hay votos registrados. ¡Sé el primero en participar!</p>
          <Link to="/votar" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Registrar mi voto
          </Link>
        </div>
      )}

      {data?.total_votes > 0 && (
        <>
          {/* Main ranking */}
          <section className="chart-section">
            <h2 className="chart-title">Ranking de intenciones de voto</h2>
            <p className="chart-subtitle">
              Ordenado por porcentaje de votos recibidos
            </p>
            <RankingChart candidates={data.candidates} totalVotes={data.total_votes} />
          </section>

          {/* Trend chart */}
          {data.trend_last_24h.length > 0 && (
            <section className="chart-section">
              <h2 className="chart-title">Tendencia — últimas 24 horas</h2>
              <p className="chart-subtitle">Votos acumulados por hora (top 5 candidatos)</p>
              <div className="card">
                <TrendChart data={data.trend_last_24h} />
              </div>
            </section>
          )}

          {/* Demographics */}
          <section className="chart-section">
            <h2 className="chart-title">Análisis demográfico</h2>
            <p className="chart-subtitle">
              Basado en los participantes que compartieron sus datos voluntariamente
            </p>
            <DemographicCharts
              byAge={data.by_age}
              bySex={data.by_sex}
              byNse={data.by_nse}
              byCity={data.by_city}
              byLocation={data.by_location}
              totalVotes={data.total_votes}
            />
          </section>
        </>
      )}

      {/* Footer note */}
      <div className="results-footer-note">
        Los datos se actualizan automáticamente cada 30 segundos.
        Los porcentajes demográficos se calculan solo sobre los votos con datos disponibles.
        Imágenes extraídas de Wikipedia (licencia libre) y portal JNE.
      </div>
    </div>
  )
}
