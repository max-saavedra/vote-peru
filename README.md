# Tendencia Electoral Peru 2026

Plataforma de sondeo informal de intenciones de voto para las elecciones presidenciales del Perú, 12 de abril de 2026.

> **Aviso:** Este sondeo no es oficial ni representativo. No está regulado por ninguna entidad electoral. Es un ejercicio de participación ciudadana que refleja la tendencia dentro de los usuarios de esta plataforma. No debe interpretarse como predicción electoral, encuesta científica ni manipulación pública.

---

## Características

- Votación única por correo electrónico (el email nunca se almacena, solo un hash SHA-256)
- 36 candidatos presidenciales registrados
- Gráficos en tiempo real: ranking, edad, sexo, NSE, ciudad, ubicación geográfica, tendencia 24h
- Modo claro/oscuro
- Responsive para móvil y escritorio
- Acceso público para ver resultados sin necesidad de votar
- Arquitectura open source y auditable

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + Recharts |
| Backend | Python 3.11 + FastAPI + SQLAlchemy async |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) |
| Servidor web | Nginx (reverse proxy) |
| Proceso backend | Uvicorn (ASGI) + Systemd |
| Deploy frontend | Vercel |
| Infraestructura | GCP VM Ubuntu 22.04 |
| Seguridad | Rate limiting, reCAPTCHA v3, CORS, HTTPS |

## Estructura del proyecto

```
tendencia-electoral-peru/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── core/
│   │   │   ├── config.py        # Configuración
│   │   │   ├── database.py      # SQLAlchemy async
│   │   │   └── candidates.py    # 36 candidatos (fuente de verdad)
│   │   ├── models/vote.py       # Modelo ORM
│   │   ├── schemas/vote.py      # Pydantic schemas
│   │   └── routers/
│   │       ├── votes.py         # POST/GET votos
│   │       ├── results.py       # Agregados y analytics
│   │       └── health.py        # Health check
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routing + tema
│   │   ├── pages/               # Landing, VotePage, ResultsPage
│   │   ├── components/          # Header, CandidateCard, Charts
│   │   ├── hooks/useResults.js  # Polling automático
│   │   └── utils/               # API client, hash
│   ├── package.json
│   ├── vercel.json
│   └── Dockerfile
├── nginx/
│   └── voto-peru.nginx.conf
├── docs/
│   └── DEPLOY.md                # Guía completa de despliegue
└── docker-compose.yml           # Para desarrollo local
```

## Desarrollo local

### Prerrequisitos

- Python 3.11+
- Node.js 20+

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Editar .env si es necesario

uvicorn app.main:app --reload
# API disponible en http://localhost:8000
# Docs en http://localhost:8000/api/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Disponible en http://localhost:3000
```

El proxy de Vite redirige automáticamente `/api/*` al backend en el puerto 8000.

### Con Docker Compose (alternativa)

```bash
docker compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/api/docs
```

## Despliegue en producción

Ver [docs/DEPLOY.md](docs/DEPLOY.md) para la guía completa de despliegue en GCP + Vercel.

## ¿Por qué este proyecto no puede manipular resultados?

1. El código fuente es público y auditable en este repositorio.
2. Cada voto está protegido por el hash del email: no se pueden insertar votos masivos sin emails únicos reales.
3. No existe ningún panel de administración para modificar votos.
4. La base de datos SQLite puede ser inspeccionada directamente — no hay forma de alterar un hash de email sin acceso físico al servidor.
5. El rate limiting bloquea intentos de votación masiva desde la misma IP.

## Licencia

MIT — libre para usar, modificar y distribuir.

## Imágenes

Las imágenes de candidatos y logos de partidos son extraídas de Wikipedia (bajo licencias libres CC) y del portal del Jurado Nacional de Elecciones (JNE). No son propiedad de este proyecto.
