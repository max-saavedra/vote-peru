# Guía de Despliegue — Tendencia Electoral Peru 2026

## Arquitectura del sistema

```
Usuario (navegador)
    │
    ├── Vercel (frontend React)
    │       └── VITE_API_URL → https://tudominio.com/api
    │
    └── GCP VM Ubuntu 22.04 (backend)
            ├── Nginx (puerto 80/443) → reverse proxy
            └── Uvicorn + FastAPI (puerto 8000, solo localhost)
                    └── SQLite (voto_peru.db) → /home/ubuntu/voto-peru/backend/
```

---

## Parte 1: Preparar la VM en Google Cloud Platform

### 1.1 Crear la instancia

```bash
# Desde Google Cloud Shell o gcloud CLI
gcloud compute instances create voto-peru-api \
  --machine-type=e2-small \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server

# Asignar IP externa estática (para que no cambie al reiniciar)
gcloud compute addresses create voto-peru-ip --region=us-central1
gcloud compute instances add-access-config voto-peru-api \
  --access-config-name="External NAT" \
  --address=$(gcloud compute addresses describe voto-peru-ip --region=us-central1 --format='get(address)')
```

### 1.2 Abrir puertos en el firewall de GCP

```bash
# Permitir HTTP y HTTPS desde cualquier IP
gcloud compute firewall-rules create allow-http-voto \
  --allow tcp:80 \
  --target-tags http-server \
  --description "HTTP para Tendencia Electoral"

gcloud compute firewall-rules create allow-https-voto \
  --allow tcp:443 \
  --target-tags https-server \
  --description "HTTPS para Tendencia Electoral"

# IMPORTANTE: el puerto 8000 (uvicorn) NO se abre al exterior.
# Solo nginx, corriendo en el mismo servidor, lo accede internamente.
```

### 1.3 Conectarse a la VM

```bash
gcloud compute ssh ubuntu@voto-peru-api --zone us-central1-a
```

---

## Parte 2: Configurar el servidor Ubuntu

### 2.1 Actualizar e instalar dependencias

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  python3.11 \
  python3.11-venv \
  python3-pip \
  nginx \
  git \
  curl \
  certbot \
  python3-certbot-nginx
```

### 2.2 Clonar el repositorio

```bash
cd /home/ubuntu
git clone https://github.com/tuusuario/tendencia-electoral-peru.git
cd tendencia-electoral-peru/backend
```

### 2.3 Configurar el entorno virtual de Python

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.4 Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Editar los valores en `.env`:

```
APP_ENV=production
SECRET_KEY=GENERA_UNA_CLAVE_LARGA_ALEATORIA_AQUI

DATABASE_URL=sqlite+aiosqlite:///./voto_peru.db

# Reemplaza con tu URL de Vercel (la obtendrás al hacer deploy del frontend)
ALLOWED_ORIGINS=["https://tendencia-electoral-peru.vercel.app","https://tudominio.com"]

# reCAPTCHA v3 (opcional pero recomendado)
RECAPTCHA_SECRET_KEY=tu_secret_key_de_recaptcha
RECAPTCHA_ENABLED=true

# Supabase Auth
SUPABASE_JWT_SECRET=tu_supabase_jwt_secret
```

Generar una clave secreta segura:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2.5 Verificar que el backend inicia correctamente

```bash
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
# Ctrl+C para detener, luego configurar como servicio
```

---

## Parte 3: Configurar Systemd (servicio permanente)

```bash
sudo nano /etc/systemd/system/voto-peru.service
```

Pegar este contenido:

```ini
[Unit]
Description=Tendencia Electoral Peru - FastAPI Backend
After=network.target

[Service]
Type=exec
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/tendencia-electoral-peru/backend
Environment="PATH=/home/ubuntu/tendencia-electoral-peru/backend/venv/bin"
ExecStart=/home/ubuntu/tendencia-electoral-peru/backend/venv/bin/uvicorn \
    app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 2 \
    --log-level info \
    --access-log
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable voto-peru
sudo systemctl start voto-peru

# Verificar que está corriendo
sudo systemctl status voto-peru

# Ver logs en tiempo real
sudo journalctl -u voto-peru -f
```

---

## Parte 4: Configurar Nginx

### 4.1 Crear el archivo de configuración

```bash
sudo nano /etc/nginx/sites-available/voto-peru
```

Pegar el contenido del archivo `nginx/voto-peru.nginx.conf` del repositorio,
reemplazando `server_name _;` con tu dominio o IP.

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/voto-peru /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Quitar el sitio por defecto

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

### 4.2 Verificar que el API responde

```bash
curl http://TU_IP_EXTERNA/api/health
# Debe responder: {"status":"ok"}
```

---

## Parte 5: Configurar HTTPS con Let's Encrypt

> Necesitas un dominio apuntando a la IP de tu VM para esto.
> Si no tienes dominio, puedes usar la IP directamente con HTTP.

```bash
# Asegurarte de que el dominio ya apunta a la IP de la VM antes de correr esto
sudo certbot --nginx -d tudominio.com

# Certbot renueva automáticamente, verifica con:
sudo systemctl status certbot.timer
```

---

## Parte 6: Desplegar el frontend en Vercel

### 6.1 Preparar variables de entorno

En el directorio `frontend/`, crear `.env.production`:
```bash
VITE_API_URL=https://tudominio.com/api
# o con IP: VITE_API_URL=http://IP_EXTERNA/api
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 6.2 Opción A: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

Durante el proceso, Vercel preguntará por las variables de entorno.
Agrega `VITE_API_URL` con el valor de tu backend.

### 6.3 Opción B: GitHub + Vercel (recomendado)

1. Hacer push del repositorio a GitHub
2. Ir a [vercel.com](https://vercel.com) → New Project → importar el repo
3. Configurar:
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. En Environment Variables agregar:
   - `VITE_API_URL` = `https://tudominio.com/api`
   - `VITE_SUPABASE_URL` = (tu URL de Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (tu clave pública Anon de Supabase)
5. Deploy

### 6.4 Actualizar CORS en el backend

Una vez que Vercel asigne una URL (ej: `tendencia-electoral.vercel.app`),
actualizar el `.env` en la VM:

```bash
# En la VM
nano /home/ubuntu/tendencia-electoral-peru/backend/.env
# Agregar la URL de Vercel a ALLOWED_ORIGINS

sudo systemctl restart voto-peru
```

---

## Parte 7: Activar reCAPTCHA v3 (opcional pero recomendado)

1. Ir a [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin/create)
2. Seleccionar reCAPTCHA v3
3. Agregar los dominios: `tudominio.com` y `tendencia-electoral.vercel.app`
4. Copiar la **Site Key** (va en el frontend) y la **Secret Key** (va en el backend)

En el frontend, instalar el SDK:
```bash
npm install react-google-recaptcha-v3
```

En `VotePage.jsx`, envolver con `GoogleReCaptchaProvider` y usar el hook
`useGoogleReCaptcha` para obtener el token antes de enviar el formulario.

En el backend `.env`:
```
RECAPTCHA_SECRET_KEY=tu_secret_key
RECAPTCHA_ENABLED=true
```

---

## Parte 8: Configurar Autenticación con Supabase (Google Auth)

Para prevenir votos con correos falsos, la plataforma ahora requiere autenticación a través de Google usando Supabase (proveedor gratuito).

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve a **Authentication > Providers** y habilita **Google**.
   - Necesitarás crear credenciales (Client ID y Client Secret) en [Google Cloud Console](https://console.cloud.google.com).
   - Coloca la URL de redirección (Redirect URI) que Supabase te proporciona en tu proyecto de GCP.
3. En Supabase, ve a **Project Settings > API**. 
4. Copia tu `Project URL` y `anon public key` en tu entorno Vercel (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
5. Copia el **JWT Secret** en el entorno de la VM del backend (`SUPABASE_JWT_SECRET`).

---

## Parte 9: Migrar a PostgreSQL (cuando el volumen crezca)

Si el número de votos supera los ~500,000 o se necesitan múltiples workers,
migrar de SQLite a PostgreSQL (ver archivo `docs/ubuntu_postgres_setup.md` para pasos detallados):

```bash
# Instalar PostgreSQL en la VM
sudo apt install postgresql postgresql-contrib -y
sudo -u postgres createuser voto_user --pwprompt
sudo -u postgres createdb voto_peru --owner voto_user

# Instalar el driver async en el entorno virtual
source venv/bin/activate
pip install asyncpg

# Actualizar .env
DATABASE_URL=postgresql+asyncpg://voto_user:PASSWORD@localhost:5432/voto_peru

sudo systemctl restart voto-peru
```

La primera vez que arranque la app con Postgres, creará las tablas automáticamente.

---

## Parte 9: Monitoreo y mantenimiento

### Ver logs del backend
```bash
sudo journalctl -u voto-peru -f --since "1 hour ago"
```

### Ver logs de nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Actualizar el código
```bash
cd /home/ubuntu/tendencia-electoral-peru
git pull origin main
source backend/venv/bin/activate
pip install -r backend/requirements.txt
sudo systemctl restart voto-peru
```

### Hacer backup de la base de datos
```bash
# Agregar al crontab para backup diario
crontab -e
# Agregar:
# 0 2 * * * cp /home/ubuntu/tendencia-electoral-peru/backend/voto_peru.db /home/ubuntu/backups/voto_peru_$(date +\%Y\%m\%d).db
```

---

## Estimación de capacidad

| Métrica | SQLite (e2-small) | PostgreSQL (e2-medium) |
|---|---|---|
| Votos/segundo sostenidos | ~50 | ~500+ |
| Votos totales soportados | ~2,000,000 | Ilimitado |
| Usuarios concurrentes (solo lectura) | ~200 | ~2,000+ |
| Costo mensual aprox. GCP | $0 (free tier) | ~$35 |

Para el caso de uso planteado (sondeo informal), SQLite en e2-small es
más que suficiente para decenas de miles de participantes.

---

## Seguridad — resumen de medidas implementadas

| Medida | Dónde | Descripción |
|---|---|---|
| Email hasheado (SHA-256) | Backend | El email nunca se guarda en crudo |
| Rate limiting por IP | FastAPI (slowapi) | 3 intentos/hora por IP |
| Rate limiting por IP | Nginx | Configurable en nginx.conf |
| Validación de candidato | Backend | Whitelist de IDs válidos |
| Sanitización de inputs | Pydantic | Regex + longitud máxima |
| CORS restringido | FastAPI | Solo orígenes autorizados |
| reCAPTCHA v3 | Opcional | Se activa con la env var |
| Headers de seguridad | Nginx | X-Frame-Options, nosniff, etc. |
| Puerto 8000 cerrado | GCP firewall | Uvicorn solo accesible por nginx |
| HTTPS | Let's Encrypt | Cifrado en tránsito |
| No SQL injection | SQLAlchemy ORM | Queries parametrizadas |
