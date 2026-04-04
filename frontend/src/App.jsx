/**
 * App root: theme provider, routing, and global layout.
 * Theme preference is persisted in localStorage.
 */

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Landing from './pages/Landing.jsx'
import VotePage from './pages/VotePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'

export default function App() {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <BrowserRouter>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/votar" element={<VotePage />} />
          <Route path="/resultados" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border)',
        marginTop: '4rem',
        lineHeight: 1.8,
      }}>
        <p>
          Este sondeo no es una encuesta oficial ni representativa de la población peruana.
          Es un ejercicio de participación ciudadana informal que refleja la tendencia
          dentro de los usuarios de esta plataforma.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          No debe interpretarse como manipulación pública ni predicción electoral.
          Código fuente abierto en GitHub · Imágenes extraídas de Wikipedia y JNE.
        </p>
      </footer>
    </BrowserRouter>
  )
}
