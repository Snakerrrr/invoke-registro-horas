# Plan de Migración - Sistema INVOKE Registro de Horas

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Estado Actual](#análisis-de-estado-actual)
3. [Objetivos de Migración](#objetivos-de-migración)
4. [Estrategia de Migración](#estrategia-de-migración)
5. [Fases de Migración](#fases-de-migración)
6. [Checklist de Preparación](#checklist-de-preparación)
7. [Plan de Ejecución](#plan-de-ejecución)
8. [Plan de Rollback](#plan-de-rollback)
9. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)
10. [Cronograma Estimado](#cronograma-estimado)

---

## 🎯 Resumen Ejecutivo

Este documento describe el plan de migración para el sistema INVOKE de Registro de Horas. La migración puede incluir cambios en infraestructura, base de datos, código, o despliegue, dependiendo de los objetivos específicos acordados en sesiones anteriores.

**Estado Actual:**
- Backend: Node.js/Express con PostgreSQL (Azure)
- Frontend: Next.js 15 con React 19 (Vercel)
- Base de Datos: PostgreSQL en Supabase
- URL Backend Actual: `https://backend-invoke.azurewebsites.net`
- URL Frontend Actual: `https://v0-invoke-registro-horas-bs.vercel.app`

**Objetivo Principal:** 
Migrar la base de datos desde la instancia actual de Supabase a una nueva instancia, actualizar configuraciones del backend y frontend para reflejar las nuevas URLs y eliminar referencias hardcodeadas a Azure.

---

## 🔍 Análisis de Estado Actual

### Arquitectura Actual

```
┌─────────────────┐
│   Frontend      │
│   Next.js 15    │
│   (Vercel)      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Backend       │
│   Express.js    │
│   (Azure)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Azure DB)    │
└─────────────────┘
```

### Componentes Identificados

#### Backend
- **Framework:** Express.js v5.1.0
- **Lenguaje:** JavaScript (CommonJS)
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT
- **Puerto:** 5000
- **Endpoints:** 10 rutas principales

#### Frontend
- **Framework:** Next.js 15.2.4
- **Lenguaje:** TypeScript
- **UI Library:** shadcn/ui + TailwindCSS
- **Estado:** React Context API
- **Puerto:** 3000

#### Base de Datos
- **Motor:** PostgreSQL 15
- **Proveedor:** Supabase
- **Instancia Actual:** `aws-0-us-east-2.pooler.supabase.com`
- **Tablas principales:** 6+ tablas
- **Datos críticos:** Usuarios, registros de horas, proyectos

---

## 🎯 Objetivos de Migración

### Objetivos Específicos

- [x] **Migración de Base de Datos Supabase**
  - Exportar datos desde instancia actual de Supabase
  - Crear nueva instancia de Supabase
  - Importar datos a la nueva instancia
  - Validar integridad de datos migrados

- [ ] **Configuración del Backend**
  - Actualizar `DATABASE_URL` en variables de entorno
  - Actualizar configuración CORS con nueva URL del frontend
  - Verificar conexión a nueva base de datos

- [ ] **Refactorización del Frontend**
  - Crear/actualizar `.env.local` con nueva URL del backend
  - Eliminar URLs hardcodeadas de Azure (33 ocurrencias identificadas)
  - Reemplazar por variables de entorno en 10 archivos específicos
  - Validar todas las conexiones

- [ ] **Verificación y Despliegue**
  - Probar backend localmente con nueva BD
  - Probar frontend localmente con nuevo backend
  - Desplegar cambios a producción
  - Validar funcionamiento completo

---

## 🗺 Estrategia de Migración

### Enfoque Recomendado: Migración por Fases

**Ventajas:**
- ✅ Reducción de riesgos
- ✅ Posibilidad de validación incremental
- ✅ Rollback más sencillo
- ✅ Menor impacto en usuarios

**Estrategia:** Migración gradual con períodos de prueba y validación entre fases.

---

## 📅 Fases de Migración Detalladas

### FASE 1: Migración de Base de Datos Supabase (Día 1)

#### 1.1 Exportar Base de Datos Actual

**Objetivo:** Crear un respaldo completo de la base de datos actual antes de la migración.

**Pasos:**

1. **Acceder al proyecto actual en Supabase Dashboard**
   - Iniciar sesión en [Supabase Dashboard](https://app.supabase.com)
   - Seleccionar el proyecto actual

2. **Obtener cadena de conexión**
   - Navegar a **Database → Settings**
   - En la sección **"Connection string"**, copiar la cadena de conexión URI
   - Formato esperado: `postgresql://postgres.juzynaimbckjnktuohoy:aPwxFivvE4xIRJBj@aws-0-us-east-2.pooler.supabase.com:5432/postgres`

3. **Crear respaldo usando pg_dump**
   ```bash
   # Ejecutar en terminal local
   pg_dump "postgresql://postgres.juzynaimbckjnktuohoy:aPwxFivvE4xIRJBj@aws-0-us-east-2.pooler.supabase.com:5432/postgres" > backup_completo.sql
   ```

   **Nota:** Si la base de datos es pequeña (< 100MB), puedes usar la herramienta de exportación visual del Dashboard de Supabase:
   - Database → Backups → Download backup

4. **Verificar el backup**
   ```bash
   # Verificar que el archivo se creó correctamente
   ls -lh backup_completo.sql
   
   # Verificar contenido (primeras líneas)
   head -n 50 backup_completo.sql
   ```

**Checklist:**
- [ ] Backup creado exitosamente
- [ ] Archivo `backup_completo.sql` verificado
- [ ] Tamaño del archivo es razonable (comparar con tamaño esperado)
- [ ] Backup almacenado en ubicación segura (múltiples copias recomendadas)

---

#### 1.2 Crear Nueva Base de Datos

**Objetivo:** Configurar la nueva instancia de Supabase que recibirá los datos migrados.

**Pasos:**

1. **Crear nuevo proyecto en Supabase**
   - Acceder a [Supabase Dashboard](https://app.supabase.com)
   - Click en **"New Project"**
   - Completar formulario:
     - **Name:** `invoke-registro-horas-prod` (o nombre deseado)
     - **Database Password:** Generar contraseña segura y **GUARDARLA**
     - **Region:** Seleccionar región apropiada
     - **Pricing Plan:** Seleccionar plan adecuado

2. **Obtener nueva cadena de conexión**
   - Una vez creado el proyecto, navegar a **Database → Settings**
   - Copiar la nueva **Connection String** (URI)
   - Formato: `postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres`
   - **⚠️ IMPORTANTE:** Guardar esta información de forma segura

3. **Verificar conectividad**
   ```bash
   # Probar conexión a la nueva base de datos
   psql "postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres" -c "SELECT version();"
   ```

**Checklist:**
- [ ] Nuevo proyecto creado en Supabase
- [ ] Contraseña de base de datos guardada de forma segura
- [ ] Nueva cadena de conexión copiada y guardada
- [ ] Conexión a nueva BD verificada

---

#### 1.3 Importar Datos

**Objetivo:** Restaurar el backup en la nueva instancia de Supabase.

**Pasos:**

1. **Preparar entorno**
   - Asegurarse de tener `psql` instalado localmente
   - Verificar que el archivo `backup_completo.sql` está accesible

2. **Restaurar backup en nueva base de datos**
   ```bash
   # Reemplazar con la nueva cadena de conexión
   psql "postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres" < backup_completo.sql
   ```

   **Alternativa con pg_restore (si el backup es formato custom):**
   ```bash
   pg_restore -d "postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres" backup_completo.dump
   ```

3. **Verificar migración**
   ```bash
   # Conectar a la nueva base de datos
   psql "postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres"
   
   # Verificar tablas creadas
   \dt
   
   # Verificar conteo de registros en tablas principales
   SELECT 'users' as tabla, COUNT(*) as registros FROM users
   UNION ALL
   SELECT 'work_hours', COUNT(*) FROM work_hours
   UNION ALL
   SELECT 'parametros', COUNT(*) FROM parametros;
   
   # Salir de psql
   \q
   ```

4. **Validación de integridad**
   - Comparar conteos de registros entre BD antigua y nueva
   - Verificar que todas las tablas existen
   - Verificar constraints y foreign keys
   - Probar algunas consultas de ejemplo

**Checklist:**
- [ ] Backup restaurado exitosamente
- [ ] Todas las tablas creadas
- [ ] Conteo de registros coincide con BD original
- [ ] Constraints y relaciones verificadas
- [ ] Consultas de prueba ejecutadas correctamente

**Entregables:**
- Base de datos migrada y verificada
- Documentación de nueva cadena de conexión
- Reporte de validación de datos

---

### FASE 2: Configuración del Backend (Día 2)

#### 2.1 Actualizar Variables de Entorno

**Objetivo:** Configurar el backend para conectarse a la nueva base de datos.

**Ubicación:** `registro-horas-invk-base/backend/.env`

**Pasos:**

1. **Localizar archivo .env**
   ```bash
   cd registro-horas-invk-base/backend
   # Si no existe, crear desde .env.example o crear nuevo archivo
   ```

2. **Actualizar DATABASE_URL**
   
   **Antes:**
   ```env
   DATABASE_URL=postgresql://postgres.juzynaimbckjnktuohoy:aPwxFivvE4xIRJBj@aws-0-us-east-2.pooler.supabase.com:5432/postgres
   ```
   
   **Después:**
   ```env
   DATABASE_URL=postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres
   ```

3. **Verificar otras variables de entorno**
   ```env
   # Mantener estas configuraciones
   JWT_SECRET=supersecreto
   JWT_EXPIRES_IN=1d
   PORT=5000
   NODE_ENV=production
   ```

4. **Validar formato de conexión**
   - Verificar que la cadena de conexión no tenga espacios
   - Verificar que las credenciales estén correctas
   - Probar conexión manualmente si es posible

**Checklist:**
- [ ] Archivo `.env` actualizado con nueva `DATABASE_URL`
- [ ] Otras variables de entorno verificadas
- [ ] Credenciales guardadas de forma segura
- [ ] Formato de conexión validado

---

#### 2.2 Actualizar Configuración CORS

**Objetivo:** Autorizar al nuevo dominio del frontend para realizar peticiones al backend.

**Ubicación:** `registro-horas-invk-base/backend/server.js` (Línea ~18)

**Pasos:**

1. **Abrir archivo server.js**
   ```bash
   cd registro-horas-invk-base/backend
   # Editar server.js
   ```

2. **Localizar configuración CORS**
   
   **Código actual (aproximadamente línea 18):**
   ```javascript
   app.use(cors({
     origin: ['https://v0-invoke-registro-horas-bs.vercel.app']
   }));
   ```

3. **Actualizar con nueva(s) URL(s) del frontend**
   
   **Opción 1: Una sola URL**
   ```javascript
   app.use(cors({
     origin: ['https://tu-nueva-url-frontend.com']
   }));
   ```
   
   **Opción 2: Múltiples URLs (producción y www)**
   ```javascript
   app.use(cors({
     origin: [
       'https://tu-nueva-url-frontend.com',
       'https://www.tu-nueva-url-frontend.com'
     ]
   }));
   ```
   
   **Opción 3: Desarrollo y producción**
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:3000', // Desarrollo local
       'https://tu-nueva-url-frontend.com' // Producción
     ]
   }));
   ```

4. **Verificar sintaxis**
   - Asegurarse de que los corchetes y comillas estén correctos
   - Verificar que no haya errores de sintaxis

**Checklist:**
- [ ] Configuración CORS actualizada en `server.js`
- [ ] Nueva(s) URL(s) del frontend agregada(s)
- [ ] Sintaxis verificada (sin errores)
- [ ] URLs de desarrollo incluidas si es necesario

---

#### 2.3 Verificar Conexión Backend-Base de Datos

**Objetivo:** Validar que el backend puede conectarse correctamente a la nueva base de datos.

**Pasos:**

1. **Instalar dependencias (si es necesario)**
   ```bash
   cd registro-horas-invk-base/backend
   npm install
   ```

2. **Iniciar servidor en modo desarrollo**
   ```bash
   npm run dev
   # o
   npm start
   ```

3. **Verificar logs de conexión**
   - Buscar en la consola: `✅ Conectado a PostgreSQL correctamente`
   - Si hay errores, revisar:
     - Formato de `DATABASE_URL`
     - Credenciales correctas
     - Firewall/red de Supabase (verificar IPs permitidas)

4. **Probar endpoint básico**
   ```bash
   # En otra terminal o navegador
   curl http://localhost:5000/
   # Debe responder: "Backend funcionando correctamente"
   ```

5. **Probar endpoint de autenticación (opcional)**
   ```bash
   # Probar login (si tienes credenciales de prueba)
   curl -X POST http://localhost:5000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

**Checklist:**
- [ ] Backend inicia sin errores
- [ ] Conexión a PostgreSQL exitosa (mensaje en consola)
- [ ] Endpoint raíz responde correctamente
- [ ] Sin errores en logs relacionados con BD

**Entregables:**
- Backend configurado con nueva base de datos
- CORS actualizado con nueva URL del frontend
- Conexión verificada y funcionando

---

### FASE 3: Configuración del Frontend (Día 3)

#### 3.1 Configurar Variable de Entorno Local

**Objetivo:** Configurar la URL del backend en el frontend mediante variables de entorno.

**Ubicación:** `registro-horas-invk-base/frontend/registro-horas/.env.local`

**Pasos:**

1. **Crear o editar archivo .env.local**
   ```bash
   cd registro-horas-invk-base/frontend/registro-horas
   # Crear archivo si no existe
   touch .env.local
   ```

2. **Agregar variable de entorno**
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://tu-nueva-url-backend.com
   ```
   
   **Nota:** 
   - En desarrollo local: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`
   - En producción: `NEXT_PUBLIC_BACKEND_URL=https://tu-backend-produccion.com`

3. **Verificar que el archivo está en .gitignore**
   ```bash
   # Verificar .gitignore incluye .env.local
   cat .gitignore | grep .env.local
   ```

**Checklist:**
- [ ] Archivo `.env.local` creado/actualizado
- [ ] Variable `NEXT_PUBLIC_BACKEND_URL` configurada
- [ ] Archivo agregado a `.gitignore` (no debe subirse a Git)

---

#### 3.2 Refactorización de URLs Hardcodeadas

**Objetivo:** Eliminar todas las referencias hardcodeadas a `https://backend-invoke.azurewebsites.net` y reemplazarlas por la variable de entorno.

**Archivos a Modificar:** 10 archivos identificados con 33 ocurrencias totales

**Tabla de Archivos:**

| Archivo | Líneas Aprox. | Tipo de Cambio | Prioridad |
|---------|---------------|----------------|-----------|
| `lib/auth.ts` | 27 | Actualizar fallback de `BACKEND_URL` | 🔴 Alta |
| `components/hour-registration-form.tsx` | 176, 207, 281, 461 | Actualizar constante `backendUrl` | 🔴 Alta |
| `app/dashboard/perfil/page.tsx` | 22 | Actualizar fallback | 🟡 Media |
| `app/dashboard/mis-registros/page.tsx` | 136, 216, 299, 338 | Actualizar constante `backendUrl` | 🔴 Alta |
| `app/dashboard/gestion-parametros/page.tsx` | 347, 432, 479, 526, 952 | Actualizar constante `backendUrl` | 🔴 Alta |
| `app/dashboard/registros-admin/page.tsx` | 97 | Actualizar constante `backendUrl` | 🟡 Media |
| `app/dashboard/usuarios-pendientes/page.tsx` | 37 | Actualizar constante `backendUrl` | 🟡 Media |
| `app/dashboard/horas-por-usuario/page.tsx` | 196, 234 | **Atención especial línea 196** | 🔴 Alta |
| `app/dashboard/gestion-usuarios/page.tsx` | 85, 123, 168, 194 | Cambiar string por template literal | 🔴 Alta |
| `app/dashboard-home.tsx` | 323, 356, 382, 439-445 | Reemplazo masivo (7 ocurrencias) | 🔴 Alta |

**Patrón de Reemplazo General:**

**Antes:**
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
```

**Después:**
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://tu-nueva-url-backend.com"
```

**Casos Especiales:**

1. **`lib/auth.ts` (línea 27):**
   ```typescript
   // Antes
   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-invoke.azurewebsites.net"
   
   // Después
   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://tu-nueva-url-backend.com"
   ```

2. **`app/dashboard/gestion-usuarios/page.tsx` (líneas 85, 123, 168, 194):**
   ```typescript
   // Antes
   const response = await authenticatedFetch("https://backend-invoke.azurewebsites.net/api/users")
   
   // Después
   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://tu-nueva-url-backend.com"
   const response = await authenticatedFetch(`${backendUrl}/api/users`)
   ```

3. **`app/dashboard/horas-por-usuario/page.tsx` (línea 196):**
   ```typescript
   // Antes
   const response = await authenticatedFetch("https://backend-invoke.azurewebsites.net/api/users")
   
   // Después
   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://tu-nueva-url-backend.com"
   const response = await authenticatedFetch(`${backendUrl}/api/users`)
   ```

4. **`app/dashboard-home.tsx` (múltiples líneas):**
   ```typescript
   // Antes
   authenticatedFetch("https://backend-invoke.azurewebsites.net/api/dashboard/summary/today")
   
   // Después
   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://tu-nueva-url-backend.com"
   authenticatedFetch(`${backendUrl}/api/dashboard/summary/today`)
   ```

**Script de Búsqueda y Reemplazo (Opcional):**

Puedes usar este script para encontrar todas las ocurrencias:
```bash
# Buscar todas las ocurrencias
cd registro-horas-invk-base/frontend/registro-horas
grep -r "backend-invoke.azurewebsites.net" --include="*.ts" --include="*.tsx" -n

# O usar el comando que ya ejecutamos:
grep -r "backend-invoke\.azurewebsites\.net" .
```

**Checklist por Archivo:**

- [ ] `lib/auth.ts` - Fallback actualizado
- [ ] `components/hour-registration-form.tsx` - 4 ocurrencias actualizadas
- [ ] `app/dashboard/perfil/page.tsx` - Fallback actualizado
- [ ] `app/dashboard/mis-registros/page.tsx` - 4 ocurrencias actualizadas
- [ ] `app/dashboard/gestion-parametros/page.tsx` - 5 ocurrencias actualizadas
- [ ] `app/dashboard/registros-admin/page.tsx` - 1 ocurrencia actualizada
- [ ] `app/dashboard/usuarios-pendientes/page.tsx` - 1 ocurrencia actualizada
- [ ] `app/dashboard/horas-por-usuario/page.tsx` - 2 ocurrencias actualizadas (especial atención línea 196)
- [ ] `app/dashboard/gestion-usuarios/page.tsx` - 4 ocurrencias actualizadas (usar template literals)
- [ ] `app/dashboard-home.tsx` - 7 ocurrencias actualizadas

**Verificación Final:**
```bash
# Verificar que no quedan referencias a Azure
grep -r "backend-invoke.azurewebsites.net" --include="*.ts" --include="*.tsx"
# No debe mostrar resultados
```

**Entregables:**
- Variable de entorno configurada
- Todos los archivos refactorizados
- Verificación de que no quedan URLs hardcodeadas
- Código listo para pruebas

---

### FASE 4: Verificación y Despliegue (Día 4)

#### 4.1 Verificar Backend Localmente

**Objetivo:** Validar que el backend funciona correctamente con la nueva base de datos antes del despliegue.

**Ubicación:** `registro-horas-invk-base/backend`

**Pasos:**

1. **Navegar al directorio del backend**
   ```bash
   cd registro-horas-invk-base/backend
   ```

2. **Instalar dependencias (si es necesario)**
   ```bash
   npm install
   ```

3. **Verificar archivo .env**
   - Asegurarse de que `.env` tiene la nueva `DATABASE_URL`
   - Verificar otras variables de entorno

4. **Iniciar servidor**
   ```bash
   npm start
   # o para desarrollo con auto-reload:
   npm run dev
   ```

5. **Verificar conexión a base de datos**
   - Buscar en consola: `✅ Conectado a PostgreSQL correctamente`
   - Si hay errores, revisar:
     - Formato de `DATABASE_URL`
     - Credenciales
     - Firewall de Supabase (verificar IPs permitidas)

6. **Probar endpoint básico**
   ```bash
   # En otra terminal o navegador
   curl http://localhost:5000/
   # Debe responder: "Backend funcionando correctamente"
   ```

7. **Probar endpoint de autenticación**
   ```bash
   # Probar login con credenciales de prueba
   curl -X POST http://localhost:5000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demo.com","password":"admin123"}'
   ```

8. **Verificar otros endpoints críticos**
   - `/api/dashboard/stats` (requiere autenticación)
   - `/api/projects` (requiere autenticación)
   - `/api/parametros` (requiere autenticación)

**Checklist:**
- [ ] Backend inicia sin errores
- [ ] Conexión a PostgreSQL exitosa
- [ ] Endpoint raíz responde correctamente
- [ ] Endpoint de login funciona
- [ ] Sin errores en logs relacionados con BD

---

#### 4.2 Verificar Frontend Localmente

**Objetivo:** Validar que el frontend se conecta correctamente al nuevo backend.

**Ubicación:** `registro-horas-invk-base/frontend/registro-horas`

**Pasos:**

1. **Navegar al directorio del frontend**
   ```bash
   cd registro-horas-invk-base/frontend/registro-horas
   ```

2. **Verificar archivo .env.local**
   ```bash
   # Verificar que existe y tiene la configuración correcta
   cat .env.local
   # Debe mostrar: NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

3. **Instalar dependencias**
   ```bash
   pnpm install
   # o
   npm install
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   pnpm dev
   # o
   npm run dev
   ```

5. **Abrir en navegador**
   ```
   http://localhost:3000
   ```

6. **Probar flujos críticos:**

   **a) Login:**
   - Intentar iniciar sesión con credenciales de prueba
   - Verificar que el token se guarda correctamente
   - Verificar redirección al dashboard

   **b) Registro de Horas:**
   - Navegar a "Registro de Horas"
   - Completar formulario y guardar
   - Verificar que se guarda correctamente
   - Verificar que aparece en "Mis Registros"

   **c) Dashboard:**
   - Verificar que carga estadísticas
   - Verificar gráficos y métricas

   **d) Gestión (solo Admin):**
   - Si eres admin, probar gestión de usuarios
   - Probar gestión de parámetros
   - Verificar reportes

7. **Verificar consola del navegador**
   - Abrir DevTools (F12)
   - Revisar pestaña Console
   - Verificar que no hay errores relacionados con conexión al backend
   - Revisar pestaña Network para verificar que las peticiones van al backend correcto

8. **Verificar logs del backend**
   - Revisar que las peticiones del frontend llegan al backend
   - Verificar que no hay errores CORS
   - Verificar que las respuestas son correctas

**Checklist:**
- [ ] Frontend inicia sin errores
- [ ] Login funciona correctamente
- [ ] Registro de horas funciona
- [ ] Dashboard carga datos
- [ ] No hay errores en consola del navegador
- [ ] No hay errores CORS
- [ ] Todas las peticiones van al backend correcto

---

#### 4.3 Deployment Final

**Objetivo:** Desplegar los cambios a producción.

**Preparación Pre-Deployment:**

1. **Commit de cambios**
   ```bash
   # Asegurarse de que todos los cambios están commiteados
   git status
   git add .
   git commit -m "Migración: Actualizar URLs y configuración de BD"
   ```

2. **Verificar que .env.local NO está en Git**
   ```bash
   # Verificar .gitignore
   cat .gitignore | grep .env.local
   # Debe mostrar: .env.local o .env*
   ```

**Backend Deployment:**

1. **Configurar variables de entorno en plataforma de hosting**
   
   **Si usas Azure:**
   - Ir a Azure Portal → App Service → Configuration
   - Agregar/Actualizar:
     - `DATABASE_URL` = nueva cadena de conexión de Supabase
     - `JWT_SECRET` = secreto JWT
     - `JWT_EXPIRES_IN` = 1d
     - `NODE_ENV` = production
   
   **Si usas otro proveedor:**
   - Seguir instrucciones específicas del proveedor
   - Asegurarse de configurar todas las variables de entorno

2. **Desplegar código**
   ```bash
   # Dependiendo de tu método de deployment
   # Git push, CI/CD, etc.
   git push origin main
   ```

3. **Verificar deployment**
   - Revisar logs de deployment
   - Verificar que el servicio inicia correctamente
   - Probar endpoint raíz: `https://tu-backend.com/`

**Frontend Deployment:**

1. **Configurar variable de entorno en plataforma de hosting**
   
   **Si usas Vercel:**
   - Ir a Vercel Dashboard → Project → Settings → Environment Variables
   - Agregar:
     - `NEXT_PUBLIC_BACKEND_URL` = URL del backend en producción
   
   **Si usas otro proveedor:**
   - Configurar variable de entorno según instrucciones del proveedor

2. **Desplegar código**
   ```bash
   # Dependiendo de tu método de deployment
   git push origin main
   # O usar CLI de Vercel:
   vercel --prod
   ```

3. **Verificar deployment**
   - Revisar que el build fue exitoso
   - Abrir la URL de producción
   - Verificar que carga correctamente

**Post-Deployment Verification:**

1. **Probar flujos completos en producción**
   - Login con credenciales reales
   - Registro de horas
   - Visualización de datos
   - Reportes y exportaciones

2. **Monitorear logs**
   - Revisar logs del backend
   - Revisar logs del frontend
   - Buscar errores o warnings

3. **Verificar métricas**
   - Tiempos de respuesta
   - Tasa de errores
   - Uso de recursos

**Checklist:**
- [ ] Variables de entorno configuradas en producción
- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado y funcionando
- [ ] Login funciona en producción
- [ ] Registro de horas funciona en producción
- [ ] No hay errores en logs
- [ ] Métricas dentro de rangos normales

**Entregables:**
- Sistema completamente migrado y funcionando en producción
- Documentación de cambios aplicados
- Reporte de verificación post-deployment

---

### FASE 5: Monitoreo Post-Migración (Días 5-7)

#### 5.1 Monitoreo Intensivo (Primeras 48 horas)

**Objetivo:** Vigilar de cerca el sistema durante las primeras horas críticas post-migración.

**Checklist de Monitoreo:**

- [ ] **Logs de Backend**
  - Revisar logs cada 2 horas
  - Buscar errores de conexión a BD
  - Buscar errores de autenticación
  - Buscar timeouts o errores 500

- [ ] **Logs de Frontend**
  - Revisar errores en consola del navegador
  - Verificar errores de red
  - Revisar errores de CORS

- [ ] **Métricas de Base de Datos**
  - Conexiones activas
  - Tiempo de respuesta de consultas
  - Uso de CPU y memoria
  - Espacio en disco

- [ ] **Feedback de Usuarios**
  - Estar disponible para reportes de usuarios
  - Documentar cualquier problema reportado
  - Responder rápidamente a issues críticos

---

#### 5.2 Validación Funcional Completa

**Objetivo:** Verificar que todas las funcionalidades principales funcionan correctamente.

**Checklist de Funcionalidades:**

**Para Consultores:**
- [ ] Login funciona
- [ ] Registro de horas funciona
- [ ] Visualización de "Mis Registros" funciona
- [ ] Dashboard personal carga correctamente
- [ ] Perfil de usuario se puede editar

**Para Administradores:**
- [ ] Todas las funciones de consultor funcionan
- [ ] Gestión de usuarios funciona
- [ ] Gestión de parámetros funciona
- [ ] Reportes se generan correctamente
- [ ] Exportación a Excel funciona
- [ ] Exportación a Smartsheet funciona
- [ ] Dashboard administrativo carga todas las métricas

---

#### 5.3 Optimización y Ajustes

**Objetivo:** Realizar ajustes menores basados en observaciones post-migración.

**Áreas a Revisar:**

- [ ] **Performance**
  - Si hay consultas lentas, optimizarlas
  - Revisar índices de base de datos
  - Verificar caché si es aplicable

- [ ] **Configuración**
  - Ajustar timeouts si es necesario
  - Optimizar configuración de conexiones a BD
  - Revisar configuración de CORS si hay problemas

- [ ] **Documentación**
  - Actualizar README con nuevas URLs
  - Documentar cambios realizados
  - Crear notas de troubleshooting si hubo problemas

**Entregables:**
- Sistema estable y funcionando
- Reporte de monitoreo
- Documentación actualizada
- Lecciones aprendidas documentadas

---

## ✅ Checklist de Preparación

### Pre-Migración

#### Infraestructura
- [ ] Entorno de staging configurado
- [ ] Acceso a producción verificado
- [ ] Herramientas de monitoreo configuradas
- [ ] Acceso a base de datos verificado

#### Código
- [ ] Código migrado y probado
- [ ] Dependencias actualizadas
- [ ] Tests creados y pasando
- [ ] Builds exitosos en CI/CD

#### Base de Datos
- [ ] Scripts de migración creados
- [ ] Scripts probados en staging
- [ ] Backups automatizados configurados
- [ ] Plan de rollback de BD preparado

#### Equipo
- [ ] Equipo informado sobre migración
- [ ] Ventana de mantenimiento acordada
- [ ] Soporte disponible durante migración
- [ ] Plan de comunicación preparado

---

## 🚀 Plan de Ejecución

### Día de Migración - Timeline Detallado

#### T-24 horas
- [ ] Backup completo de producción
- [ ] Verificar estado de staging
- [ ] Revisar checklist final
- [ ] Confirmar ventana de mantenimiento

#### T-2 horas
- [ ] Notificar usuarios sobre mantenimiento
- [ ] Preparar scripts de migración
- [ ] Verificar acceso a sistemas
- [ ] Briefing del equipo

#### T-0 (Inicio de Migración)
- [ ] Activar modo mantenimiento
- [ ] Backup final de producción
- [ ] Verificar backup exitoso

#### T+30 minutos
- [ ] Ejecutar migración de base de datos
- [ ] Verificar integridad de datos
- [ ] Desplegar nuevo código

#### T+60 minutos
- [ ] Verificar servicios funcionando
- [ ] Probar endpoints críticos
- [ ] Validar autenticación

#### T+90 minutos
- [ ] Pruebas de usuario clave
- [ ] Verificar reportes y exportaciones
- [ ] Revisar logs de errores

#### T+120 minutos
- [ ] Desactivar modo mantenimiento
- [ ] Notificar usuarios
- [ ] Monitoreo activo

---

## 🔄 Plan de Rollback

### Criterios para Rollback

Ejecutar rollback si:
- ❌ Más del 5% de requests fallan
- ❌ Errores críticos en autenticación
- ❌ Pérdida de datos detectada
- ❌ Sistema inestable por más de 30 minutos

### Procedimiento de Rollback

#### Paso 1: Activar Modo Mantenimiento
```bash
# Activar modo mantenimiento
# Redirigir tráfico a versión anterior
```

#### Paso 2: Restaurar Base de Datos
```bash
# Restaurar backup de producción
pg_restore -d nombre_bd backup_pre_migracion.dump
```

#### Paso 3: Revertir Código
```bash
# Revertir a versión anterior
git revert <commit_migracion>
# O desplegar versión anterior desde CI/CD
```

#### Paso 4: Verificación
- [ ] Verificar servicios funcionando
- [ ] Probar endpoints críticos
- [ ] Validar datos restaurados
- [ ] Desactivar modo mantenimiento

### Tiempo Estimado de Rollback: 30-60 minutos

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos durante migración | Baja | Alto | Backups múltiples y validación |
| Tiempo de inactividad prolongado | Media | Alto | Migración en horario de bajo tráfico |
| Errores no detectados en staging | Media | Medio | Pruebas exhaustivas y UAT |
| Problemas de compatibilidad | Baja | Medio | Análisis previo de dependencias |
| Falta de recursos del equipo | Baja | Medio | Planificación adecuada y recursos asignados |

### Plan de Contingencia

1. **Backup Múltiple:** Mantener backups en diferentes ubicaciones
2. **Ventana de Mantenimiento:** Ejecutar en horario de bajo tráfico
3. **Equipo de Soporte:** Disponible durante toda la migración
4. **Monitoreo Continuo:** Alertas automáticas para errores críticos
5. **Comunicación:** Canal de comunicación abierto con usuarios

---

## 📊 Cronograma Estimado

### Timeline Detallado

```
Día 1: Migración de Base de Datos Supabase
├── Exportar BD actual (1-2 horas)
├── Crear nueva instancia Supabase (30 min)
├── Importar datos (1-2 horas)
└── Validar migración (1 hora)
Total: 4-5 horas

Día 2: Configuración del Backend
├── Actualizar .env con nueva DATABASE_URL (15 min)
├── Actualizar CORS en server.js (15 min)
├── Verificar conexión local (1 hora)
└── Probar endpoints (1 hora)
Total: 2-3 horas

Día 3: Configuración del Frontend
├── Crear/actualizar .env.local (15 min)
├── Refactorizar 10 archivos (3-4 horas)
├── Verificar cambios (1 hora)
└── Probar localmente (1-2 horas)
Total: 5-7 horas

Día 4: Verificación y Despliegue
├── Verificar backend local (1 hora)
├── Verificar frontend local (1-2 horas)
├── Deployment backend (1 hora)
├── Deployment frontend (1 hora)
└── Verificación post-deployment (1-2 horas)
Total: 5-7 horas

Días 5-7: Monitoreo Post-Migración
├── Monitoreo intensivo (distribuido)
├── Validación funcional completa (2-3 horas)
└── Optimización y ajustes (según necesidad)
Total: 2-4 horas distribuidas
```

**Duración Total Estimada:** 4-5 días de trabajo activo + 3 días de monitoreo

**Nota:** Los tiempos pueden variar según:
- Tamaño de la base de datos
- Experiencia del equipo
- Complejidad de los despliegues
- Problemas encontrados durante la migración

---

## 📝 Resumen de Cambios

### Componentes Modificados

| Componente | Archivo / Ubicación | Qué Cambiar |
|------------|---------------------|-------------|
| **Base de Datos** | Supabase Dashboard / CLI | Exportar de instancia actual, Importar a nueva |
| **Backend** | `backend/.env` | `DATABASE_URL` con nueva cadena de conexión |
| **Backend** | `backend/server.js` (Línea ~18) | URL del frontend en configuración CORS |
| **Frontend** | `frontend/.../.env.local` | `NEXT_PUBLIC_BACKEND_URL` con nueva URL del backend |
| **Frontend** | 10 archivos específicos (ver Fase 3) | Reemplazar URLs hardcodeadas de Azure por variables de entorno |

### Archivos Frontend a Modificar

1. `lib/auth.ts` - 1 ocurrencia
2. `components/hour-registration-form.tsx` - 4 ocurrencias
3. `app/dashboard/perfil/page.tsx` - 1 ocurrencia
4. `app/dashboard/mis-registros/page.tsx` - 4 ocurrencias
5. `app/dashboard/gestion-parametros/page.tsx` - 5 ocurrencias
6. `app/dashboard/registros-admin/page.tsx` - 1 ocurrencia
7. `app/dashboard/usuarios-pendientes/page.tsx` - 1 ocurrencia
8. `app/dashboard/horas-por-usuario/page.tsx` - 2 ocurrencias
9. `app/dashboard/gestion-usuarios/page.tsx` - 4 ocurrencias
10. `app/dashboard-home.tsx` - 7 ocurrencias

**Total:** 33 ocurrencias en 10 archivos

---

## 🔧 Scripts Útiles

### Script de Verificación Post-Migración

```bash
#!/bin/bash
# verify-migration.sh

echo "🔍 Verificando migración..."

# Verificar que no quedan referencias a Azure en frontend
echo "1. Buscando referencias a Azure en frontend..."
cd registro-horas-invk-base/frontend/registro-horas
AZURE_REFS=$(grep -r "backend-invoke.azurewebsites.net" --include="*.ts" --include="*.tsx" | wc -l)
if [ $AZURE_REFS -eq 0 ]; then
    echo "✅ No se encontraron referencias a Azure"
else
    echo "❌ Se encontraron $AZURE_REFS referencias a Azure"
    grep -r "backend-invoke.azurewebsites.net" --include="*.ts" --include="*.tsx"
fi

# Verificar variables de entorno
echo "2. Verificando variables de entorno..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local existe"
    grep "NEXT_PUBLIC_BACKEND_URL" .env.local
else
    echo "❌ .env.local no existe"
fi

echo "✅ Verificación completada"
```

### Script de Backup Automático

```bash
#!/bin/bash
# backup-supabase.sh

# Configurar estas variables
OLD_DB_URL="postgresql://postgres.juzynaimbckjnktuohoy:aPwxFivvE4xIRJBj@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "📦 Creando backup..."
pg_dump "$OLD_DB_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado: $BACKUP_FILE"
    # Mantener solo los últimos 5 backups
    ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs rm -f
else
    echo "❌ Error al crear backup"
    exit 1
fi
```

---

## 📝 Notas Adicionales

### Consideraciones Especiales

- **Migración de Datos:** La migración de Supabase es relativamente sencilla, pero asegúrate de tener backups múltiples
- **Downtime:** Esta migración puede requerir un breve período de mantenimiento durante el cambio de configuración
- **Variables de Entorno:** Nunca commitees archivos `.env` o `.env.local` a Git
- **CORS:** Asegúrate de incluir todas las URLs necesarias (desarrollo, staging, producción)
- **Testing:** Prueba exhaustivamente en local antes de desplegar a producción

### Troubleshooting Común

**Problema:** Error de conexión a base de datos
- **Solución:** Verificar formato de `DATABASE_URL`, credenciales, y firewall de Supabase

**Problema:** Error CORS en frontend
- **Solución:** Verificar que la URL del frontend está en la lista de `origin` en `server.js`

**Problema:** Frontend sigue usando URL antigua
- **Solución:** Verificar `.env.local`, limpiar caché de Next.js (`rm -rf .next`), reiniciar servidor

**Problema:** Variables de entorno no se cargan
- **Solución:** Verificar que las variables empiezan con `NEXT_PUBLIC_` para variables del frontend, reiniciar servidor

### Próximos Pasos

1. ✅ Revisar este plan completo
2. ✅ Preparar credenciales y acceso a Supabase
3. ✅ Asignar responsables para cada fase
4. ✅ Confirmar cronograma y ventana de mantenimiento
5. ✅ Iniciar Fase 1: Migración de Base de Datos

---

## 📞 Contactos y Responsables

**Líder de Migración:** [NOMBRE]  
**Equipo Backend:** [NOMBRES]  
**Equipo Frontend:** [NOMBRES]  
**DBA:** [NOMBRE]  
**DevOps:** [NOMBRE]  

---

**Versión del Plan:** 1.0  
**Fecha de Creación:** 2024  
**Última Actualización:** [FECHA]  
**Estado:** [BORRADOR / APROBADO / EN EJECUCIÓN]

---

## 🔄 Historial de Cambios

| Fecha | Versión | Cambios | Autor |
|-------|---------|---------|-------|
| 2024 | 1.0 | Creación inicial del plan | Sistema |

---

**Nota:** Este plan debe ser revisado y ajustado según los objetivos específicos de migración discutidos en sesiones anteriores. Si no hay contexto previo, este plan proporciona una base sólida que puede ser adaptada a las necesidades específicas del proyecto.
