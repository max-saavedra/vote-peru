/**
 * Site header: logo, navigation links, and dark/light theme toggle.
 */

import { Link, useLocation } from 'react-router-dom'
import './Header.css'

export default function Header({ theme, onToggleTheme }) {
  const { pathname } = useLocation()

  return (
    <header className="header">
      <div className="header-inner container">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-flag">🇵🇪</span>
          <span className="logo-text">
            Tendencia Electoral
            <span className="logo-year"> 2026</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="nav">
          <Link
            to="/resultados"
            className={`nav-link ${pathname === '/resultados' ? 'active' : ''}`}
          >
            Ver resultados
          </Link>
          <Link to="/votar" className="btn btn-primary btn-sm">
            Registrar voto
          </Link>
        </nav>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </div>
    </header>
  )
}
