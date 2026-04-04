# Instalación y Configuración de PostgreSQL en Ubuntu 22.04 LTS

Esta guía detalla los pasos para reemplazar SQLite por PostgreSQL para el backend de Voto Perú, corriendo de manera local en tu Máquina Virtual de GCP (Ubuntu).

## 1. Instalación de PostgreSQL

En la VM, ejecuta los siguientes comandos para actualizar los repositorios e instalar PostgreSQL y sus utilidades básicas:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

El servicio debería iniciar automáticamente. Para confirmarlo:
```bash
sudo systemctl status postgresql
```

## 2. Creación del Usuario y la Base de Datos

PostgreSQL crea por defecto un usuario administrador llamado `postgres`. Cambiaremos a ese usuario temporalmente para crear el entorno de nuestra aplicación:

```bash
# Iniciar sesión como el usuario postgres
sudo -i -u postgres

# Crear un usuario para la aplicación (te pedirá ingresar una contraseña, usa una segura)
createuser --interactive --pwprompt voto_user
```
> **Nota:** Responde "n" (No) a las preguntas sobre si el usuario debe ser superusuario, si debe poder crear bases de datos y roles. Solo necesitamos acceso básico.

```bash
# Crear la base de datos y asignar a nuestro nuevo usuario como dueño
createdb -O voto_user voto_peru

# Salir del usuario postgres y volver a tu usuario 'ubuntu'
exit
```

## 3. Configuración de PostgreSQL para FastAPI (asyncpg)

Instalaremos el driver para conexiones asíncronas recomendado para FastAPI. Entra a tu carpeta del backend y al entorno virtual:

```bash
cd /home/ubuntu/tendencia-electoral-peru/backend
source venv/bin/activate
pip install asyncpg
```

*(Si `asyncpg` ya está en `requirements.txt` descomentado, simplemente ejecuta `pip install -r requirements.txt`).*

## 4. Actualización del `.env` del Backend

Edita tu archivo `/home/ubuntu/tendencia-electoral-peru/backend/.env`:

```bash
nano .env
```

Modifica la variable `DATABASE_URL` cambiando el prefijo `sqlite+aiosqlite` por el driver de Postgres:

```env
# Ejemplo de formato: postgresql+asyncpg://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_DB
DATABASE_URL=postgresql+asyncpg://voto_user:TU_CONTRASEÑA_SEGURA@localhost:5432/voto_peru
```

## 5. Aplicar Cambios y Reiniciar

FastAPI ( SQLAlchemy ) tiene configurado `create_tables()` en el ciclo de vida de la aplicación. Esto significa que al arrancar, creará las tablas automáticamente en Postgres.

```bash
# Reiniciar el servicio de producción
sudo systemctl restart voto-peru

# Revisar los logs para confirmar que no hubo errores en la conexión
sudo journalctl -u voto-peru -f
```

## Respaldo de Base de Datos (Opcional / Recomendado)

Es útil hacer backups regulares. Puedes crear un script o crontab (comando programado) que ejecute un `pg_dump`:

```bash
pg_dump -U voto_user -h localhost voto_peru > /home/ubuntu/backups/voto_peru_$(date +\%F).sql
```
*(Deberás colocar la contraseña temporalmente o usar el archivo `.pgpass` de postgres).*
