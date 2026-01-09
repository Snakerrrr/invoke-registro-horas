# 📋 Guía de Migración - Sistema de Registro de Horas INVOKE

## 🔍 Estado Actual del Proyecto

### Arquitectura Actual

El proyecto está configurado con la siguiente arquitectura:

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Next.js 15)                                      │
│  └─ Deploy: Vercel                                          │
│  └─ URL: v0-invoke-registro-horas-bs.vercel.app            │
│  └─ Puerto: 3000 (desarrollo)                               │
│                                                              │
│  Backend (Node.js + Express)                                │
│  └─ Deploy: Azure App Service                               │
│  └─ URL: backend-invoke.azurewebsites.net                  │
│  └─ Puerto: 5000 (desarrollo)                               │
│                                                              │
│  Base de Datos (PostgreSQL 15)                              │
│  └─ Local: Docker Compose                                   │
│  └─ Producción: Azure Database (probablemente)              │
│                                                              │
│  Servicios Adicionales                                      │
│  └─ pgAdmin: Puerto 5055 (solo desarrollo)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

#### Backend
- **Runtime**: Node.js 18
- **Framework**: Express 5.1.0
- **Base de Datos**: PostgreSQL 15
- **ORM/Driver**: pg (PostgreSQL client)
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcrypt para hash de contraseñas
- **CORS**: Configurado para Vercel

#### Frontend
- **Framework**: Next.js 15.2.4
- **Lenguaje**: TypeScript
- **UI**: React 19
- **Estilos**: Tailwind CSS
- **Componentes**: Radix UI
- **Gestión de Estado**: React Context API
- **Package Manager**: pnpm

### Configuración Actual

#### Variables de Entorno Requeridas

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=tu_secreto_jwt_aqui
JWT_EXPIRES_IN=1h
PORT=5000
NODE_ENV=production|development
DAILY_GOAL_HOURS=8
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_BACKEND_URL=https://backend-invoke.azurewebsites.net
```

#### URLs Hardcodeadas (⚠️ Requieren Cambio)

1. **Backend - CORS** (`backend/server.js:18`)
   ```javascript
   origin: ['https://v0-invoke-registro-horas-bs.vercel.app']
   ```

2. **Frontend - Backend URL** (múltiples archivos)
   - Fallback hardcodeado: `"https://backend-invoke.azurewebsites.net"`
   - Archivos afectados:
     - `lib/auth.ts:27`
     - `components/hour-registration-form.tsx` (4 ocurrencias)
     - `app/dashboard/perfil/page.tsx:22`
     - `app/dashboard/mis-registros/page.tsx` (4 ocurrencias)
     - `app/dashboard/gestion-parametros/page.tsx` (5 ocurrencias)
     - `app/dashboard/registros-admin/page.tsx:97`
     - `app/dashboard/usuarios-pendientes/page.tsx:37`
     - `app/dashboard/horas-por-usuario/page.tsx:234`

---

## 🚀 Plan de Migración

### Fase 1: Preparación y Análisis

#### 1.1 Inventario de Dependencias

**Backend Dependencies**
```json
{
  "bcrypt": "^6.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.5.0",
  "express": "^5.1.0",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.16.0"
}
```

**Frontend Dependencies**
- Ver `frontend/registro-horas/package.json` completo
- Principales: Next.js 15, React 19, TypeScript 5

#### 1.2 Base de Datos - Esquema Actual

**Tablas Identificadas:**
- `users` - Usuarios del sistema
- `work_hours` - Registros de horas trabajadas
- `parametros` - Tabla genérica para países, proyectos, tipos de hora, PMs
- `roles` - Roles de usuario
- `attendance_reports` - Reportes de asistencia
- `attendance_config` - Configuración de asistencia
- `attendance_exceptions` - Excepciones de asistencia
- `projects` - Proyectos (tabla adicional)

**⚠️ IMPORTANTE**: El archivo `init.sql` solo contiene la tabla `users`. Necesitas:
1. Exportar el esquema completo de la base de datos actual
2. Documentar todas las relaciones y constraints
3. Exportar datos de referencia (roles, parámetros iniciales)

#### 1.3 Endpoints del Backend

**Rutas Principales:**
- `/api/users/*` - Gestión de usuarios
- `/api/auth/*` - Autenticación
- `/api/hours/*` - Registros de horas
- `/api/parametros/*` - Parámetros del sistema
- `/api/projects/*` - Proyectos
- `/api/reportes/*` - Reportes y exportaciones
- `/api/dashboard/*` - Dashboard
- `/api/vacations/*` - Vacaciones
- `/api/attendance/*` - Asistencia remota

---

### Fase 2: Configuración del Nuevo Entorno

#### 2.1 Checklist de Infraestructura

**Backend:**
- [ ] Servidor/Plataforma seleccionada (AWS, GCP, Azure, VPS, etc.)
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 15+ configurado
- [ ] Variables de entorno configuradas
- [ ] Dominio/URL del backend configurado
- [ ] SSL/HTTPS configurado
- [ ] Firewall/seguridad configurado

**Frontend:**
- [ ] Plataforma de hosting (Vercel, Netlify, AWS Amplify, etc.)
- [ ] Variables de entorno configuradas
- [ ] Dominio/URL del frontend configurado
- [ ] SSL/HTTPS configurado

**Base de Datos:**
- [ ] PostgreSQL instalado/configurado
- [ ] Backup de la base de datos actual
- [ ] Credenciales de acceso
- [ ] Conexión desde el nuevo backend probada

#### 2.2 Variables de Entorno - Template

Crea un archivo `.env.example` en cada proyecto:

**Backend/.env.example**
```env
# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_db

# JWT
JWT_SECRET=genera_un_secreto_seguro_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=1h

# Servidor
PORT=5000
NODE_ENV=production

# Configuración
DAILY_GOAL_HOURS=8

# CORS (URLs permitidas separadas por coma)
ALLOWED_ORIGINS=https://tu-frontend.com,https://www.tu-frontend.com
```

**Frontend/.env.local.example**
```env
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.com
```

---

### Fase 3: Migración de Base de Datos

#### 3.1 Exportar Base de Datos Actual

```bash
# Exportar esquema completo
pg_dump -h host_actual -U usuario -d nombre_db --schema-only > schema.sql

# Exportar datos
pg_dump -h host_actual -U usuario -d nombre_db --data-only > data.sql

# Exportar todo (esquema + datos)
pg_dump -h host_actual -U usuario -d nombre_db > backup_completo.sql
```

#### 3.2 Importar en Nueva Base de Datos

```bash
# Crear base de datos nueva
createdb -h nuevo_host -U nuevo_usuario nombre_db_nueva

# Importar esquema
psql -h nuevo_host -U nuevo_usuario -d nombre_db_nueva < schema.sql

# Importar datos
psql -h nuevo_host -U nuevo_usuario -d nombre_db_nueva < data.sql

# O importar todo
psql -h nuevo_host -U nuevo_usuario -d nombre_db_nueva < backup_completo.sql
```

#### 3.3 Verificar Migración de Base de Datos

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar datos críticos
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM work_hours;
SELECT COUNT(*) FROM parametros;

-- Verificar relaciones
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

### Fase 4: Actualización de Código

#### 4.1 Cambios en Backend

**Archivo: `backend/server.js`**

**ANTES:**
```javascript
app.use(cors({
  origin: ['https://v0-invoke-registro-horas-bs.vercel.app']
}));
```

**DESPUÉS:**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true
}));
```

#### 4.2 Cambios en Frontend

**Crear archivo: `frontend/registro-horas/lib/config.ts`**

```typescript
/**
 * Configuración centralizada de la aplicación
 */
export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
} as const;

// Validar que la URL esté configurada
if (!config.backendUrl && typeof window !== 'undefined') {
  console.error('⚠️ NEXT_PUBLIC_BACKEND_URL no está configurado');
}
```

**Actualizar: `lib/auth.ts`**

**ANTES:**
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
```

**DESPUÉS:**
```typescript
import { config } from './config';
const BACKEND_URL = config.backendUrl;
```

**Actualizar todos los archivos que usan la URL hardcodeada:**

Buscar y reemplazar en todos los archivos:
```typescript
// ANTES
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"

// DESPUÉS
import { config } from '@/lib/config';
const backendUrl = config.backendUrl;
```

#### 4.3 Script de Búsqueda y Reemplazo

```bash
# Buscar todas las ocurrencias
grep -r "backend-invoke.azurewebsites.net" frontend/

# Buscar todas las ocurrencias de v0-invoke
grep -r "v0-invoke-registro-horas-bs.vercel.app" backend/
```

---

### Fase 5: Deployment

#### 5.1 Backend - Opciones de Deployment

**Opción A: Docker (Recomendado)**
```dockerfile
# backend/Dockerfile (ya existe, verificar)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**Opción B: Servidor VPS**
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Clonar repositorio
git clone <repo>
cd backend

# Instalar dependencias
npm install --production

# Configurar variables de entorno
nano .env

# Iniciar con PM2
pm2 start server.js --name "invoke-backend"
pm2 save
pm2 startup
```

**Opción C: Plataformas Cloud**
- **Azure App Service**: Ya está configurado
- **AWS Elastic Beanstalk**: Requiere configuración
- **Google Cloud Run**: Requiere Dockerfile
- **Heroku**: Requiere Procfile

#### 5.2 Frontend - Opciones de Deployment

**Opción A: Vercel (Actual)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd frontend/registro-horas
vercel

# Configurar variables de entorno en dashboard de Vercel
```

**Opción B: Netlify**
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend/registro-horas
netlify deploy --prod
```

**Opción C: Docker + Nginx**
```dockerfile
# frontend/Dockerfile (ya existe)
FROM node:18-alpine
WORKDIR /app
COPY registro-horas/ .
RUN npm install -g pnpm && pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

#### 5.3 Configuración de Variables de Entorno en Plataformas

**Vercel:**
1. Dashboard → Proyecto → Settings → Environment Variables
2. Agregar: `NEXT_PUBLIC_BACKEND_URL`

**Azure App Service:**
1. Portal → App Service → Configuration → Application Settings
2. Agregar todas las variables de entorno

**AWS/Heroku/Google Cloud:**
- Cada plataforma tiene su método en el dashboard o CLI

---

### Fase 6: Testing Post-Migración

#### 6.1 Checklist de Verificación

**Backend:**
- [ ] Servidor inicia correctamente
- [ ] Conexión a base de datos exitosa
- [ ] Endpoint `/` responde
- [ ] Endpoint `/api/users/login` funciona
- [ ] JWT se genera correctamente
- [ ] CORS permite requests del frontend
- [ ] Logs funcionan correctamente

**Frontend:**
- [ ] Build exitoso (`npm run build`)
- [ ] Aplicación inicia correctamente
- [ ] Login funciona
- [ ] Conexión al backend exitosa
- [ ] Rutas protegidas funcionan
- [ ] Variables de entorno cargadas

**Base de Datos:**
- [ ] Todas las tablas existen
- [ ] Datos migrados correctamente
- [ ] Constraints y foreign keys funcionan
- [ ] Índices creados
- [ ] Usuarios pueden autenticarse

**Integración:**
- [ ] Frontend puede comunicarse con backend
- [ ] Autenticación end-to-end funciona
- [ ] Registro de horas funciona
- [ ] Reportes se generan correctamente
- [ ] Exportaciones funcionan

#### 6.2 Tests de Humo (Smoke Tests)

```bash
# Backend Health Check
curl https://tu-backend.com/

# Backend API Check
curl -X POST https://tu-backend.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Frontend Check
curl https://tu-frontend.com/
```

---

### Fase 7: Documentación y Rollback

#### 7.1 Documentación Post-Migración

Crear documentación con:
- URLs de producción
- Credenciales de acceso (en gestor de secretos)
- Estructura de base de datos
- Endpoints disponibles
- Variables de entorno requeridas
- Procedimientos de backup

#### 7.2 Plan de Rollback

**Si algo sale mal:**

1. **Backend:**
   - Revertir cambios en código
   - Restaurar variables de entorno anteriores
   - Redeployar versión anterior

2. **Base de Datos:**
   - Restaurar backup anterior
   - Verificar integridad de datos

3. **Frontend:**
   - Revertir a commit anterior
   - Redeployar en plataforma

---

## 📝 Checklist Completo de Migración

### Pre-Migración
- [ ] Backup completo de base de datos actual
- [ ] Exportar todas las variables de entorno
- [ ] Documentar todas las URLs y endpoints
- [ ] Listar todas las dependencias
- [ ] Verificar versión de Node.js requerida
- [ ] Verificar versión de PostgreSQL requerida

### Configuración
- [ ] Nueva infraestructura configurada
- [ ] Base de datos nueva creada
- [ ] Variables de entorno configuradas
- [ ] URLs actualizadas en código
- [ ] CORS configurado correctamente
- [ ] SSL/HTTPS configurado

### Migración
- [ ] Esquema de base de datos migrado
- [ ] Datos migrados
- [ ] Código actualizado
- [ ] Dependencias instaladas
- [ ] Builds exitosos

### Testing
- [ ] Tests de backend pasan
- [ ] Tests de frontend pasan
- [ ] Tests de integración pasan
- [ ] Tests de usuario final pasan

### Post-Migración
- [ ] Monitoreo configurado
- [ ] Logs funcionando
- [ ] Alertas configuradas
- [ ] Documentación actualizada
- [ ] Equipo notificado

---

## 🔧 Comandos Útiles

### Backup de Base de Datos
```bash
# Backup completo
pg_dump -h host -U usuario -d nombre_db -F c -f backup.dump

# Restaurar
pg_restore -h host -U usuario -d nombre_db backup.dump
```

### Verificar Conexión
```bash
# Backend a DB
psql $DATABASE_URL -c "SELECT version();"

# Frontend a Backend
curl $NEXT_PUBLIC_BACKEND_URL/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Logs
```bash
# Backend (si usa PM2)
pm2 logs invoke-backend

# Docker
docker-compose logs -f backend
```

---

## ⚠️ Puntos Críticos a Considerar

1. **SQL Injection**: Corregir en `routes/reportes.js:18` antes de migrar
2. **Secrets**: Nunca commitear `.env` files
3. **CORS**: Configurar correctamente para producción
4. **HTTPS**: Obligatorio en producción
5. **Backups**: Automatizar backups de base de datos
6. **Monitoring**: Configurar alertas y monitoreo
7. **Rate Limiting**: Implementar en producción
8. **Error Handling**: Mejorar antes de migrar

---

## 📞 Soporte y Recursos

### Archivos de Referencia
- `docker-compose.yml` - Configuración local
- `backend/Dockerfile` - Imagen Docker backend
- `frontend/Dockerfile` - Imagen Docker frontend
- `backend/package.json` - Dependencias backend
- `frontend/registro-horas/package.json` - Dependencias frontend

### Comandos de Desarrollo Local
```bash
# Iniciar todo con Docker
docker-compose up -d

# Solo backend
cd backend && npm run dev

# Solo frontend
cd frontend/registro-horas && pnpm dev
```

---

**Última actualización**: Generado automáticamente
**Versión del documento**: 1.0
