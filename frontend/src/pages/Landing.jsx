/**
 * Landing page: presents the two main actions - vote or view results.
 * Includes the disclaimer about the informal nature of the poll.
 */

import { Link } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date('2026-04-12') - new Date()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero container">
        <div className="hero-badge">
          <span className="pulse-dot" />
          Sondeo en tiempo real · {daysLeft} días para las elecciones
        </div>

        <h1 className="hero-title">
          ¿A quién votarías para<br />
          <span className="hero-accent">Presidente del Perú</span>?
        </h1>

        <p className="hero-subtitle">
          Elecciones presidenciales · 12 de abril de 2026
        </p>

        {/* Action cards */}
        <div className="action-cards">
          <Link to="/votar" className="action-card action-primary">
            <div className="action-icon">🗳️</div>
            <h2>Registrar mi intención de voto</h2>
            <p>Elige tu candidato y comparte datos demográficos para enriquecer el análisis.</p>
            <span className="action-cta">Participar ahora</span>
          </Link>

          <Link to="/resultados" className="action-card action-secondary">
            <div className="action-icon">📊</div>
            <h2>Ver cómo van las tendencias</h2>
            <p>Consulta los gráficos en tiempo real sin necesidad de registrar tu voto.</p>
            <span className="action-cta">Ver resultados</span>
          </Link>
        </div>
      </section>

      {/* Disclaimer section */}
      <section className="disclaimer-section container">
        <div className="disclaimer-card">
          <h3>Sobre este sondeo</h3>
          <div className="disclaimer-grid">
            <div className="disclaimer-item">
              <span className="disclaimer-icon">ℹ️</span>
              <div>
                <strong>No es una encuesta oficial</strong>
                <p>Este sondeo no está regulado ni respaldado por ninguna entidad electoral. Solo refleja la tendencia dentro de los usuarios de esta plataforma.</p>
              </div>
            </div>
            <div className="disclaimer-item">
              <span className="disclaimer-icon">🔍</span>
              <div>
                <strong>Participación voluntaria e informal</strong>
                <p>Es un ejercicio de participación ciudadana. No es una encuesta representativa y no debe interpretarse como predicción o manipulación pública.</p>
              </div>
            </div>
            <div className="disclaimer-item">
              <span className="disclaimer-icon">🔒</span>
              <div>
                <strong>Tu correo está protegido</strong>
                <p>Solo almacenamos un hash cifrado de tu email para evitar duplicados. Nunca guardamos tu dirección real.</p>
              </div>
            </div>
            <div className="disclaimer-item">
              <span className="disclaimer-icon">🌐</span>
              <div>
                <strong>Código abierto y transparente</strong>
                <p>Todo el desarrollo está disponible en GitHub para que cualquier persona pueda verificar que los resultados no pueden ser manipulados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
