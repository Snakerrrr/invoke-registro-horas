# Plan de Migración - Sistema INVOKE Registro de Horas

## 📋 Resumen

Este documento describe el plan de migración para trasladar la base de datos desde la instancia actual de Supabase a una nueva, y actualizar las configuraciones del backend y frontend.

**Objetivo Principal:** 
Migrar la base de datos desde la instancia actual de Supabase a una nueva instancia, actualizar configuraciones del backend y frontend para reflejar las nuevas URLs y eliminar referencias hardcodeadas a Azure.

---

## 10.1 Migración de Base de Datos (Supabase)

El objetivo es trasladar la data desde la instancia actual de Supabase a una nueva.

### Paso 1.1: Exportar base de datos actual

1. Accede a tu proyecto actual en el Supabase Dashboard.
2. Navega a **Database → Settings**.
3. En la sección **"Connection string"**, copia la cadena de conexión URI.
4. Ejecuta el siguiente comando en tu terminal para crear un respaldo:

```bash
pg_dump "postgresql://postgres.juzynaimbckjnktuohoy:aPwxFivvE4xIRJBj@aws-0-us-east-2.pooler.supabase.com:5432/postgres" > backup_completo.sql
```

**Nota:** Alternativamente, puedes usar la herramienta de exportación visual del Dashboard de Supabase si la base de datos es pequeña.

### Paso 1.2: Crear nueva base de datos

1. Crea un nuevo proyecto en Supabase (o selecciona el destino).
2. Copia y guarda la nueva cadena de conexión (Connection String) y la contraseña de la base de datos.

### Paso 1.3: Importar datos

1. Utiliza la cadena de conexión del nuevo proyecto.
2. Restaura el respaldo ejecutando:

```bash
psql "postgresql://postgres.nuevo_proyecto:password@nuevo_host:5432/postgres" < backup_completo.sql
```

---

## 10.2: Configuración del Backend

Ajuste de variables de entorno y permisos de seguridad (CORS).

### Paso 2.1: Actualizar variables de entorno (.env)

**Ubicación:** `registro-horas-invk-base/backend/.env`

Actualiza la variable `DATABASE_URL` con los datos de la Fase 1.

**Cambiar:**
```env
DATABASE_URL=postgresql://postgres.juzynaimbckjnktuohoy:aPwxFivvE4xIRJBj@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

**Por:**
```env
DATABASE_URL=postgresql://postgres.nuevo_proyecto:Nueva-contraseña@nuevo_host:5432/postgres
```

Mantén el resto de la configuración intacta:
```env
JWT_SECRET=supersecreto 
JWT_EXPIRES_IN=1d
```

### Paso 2.2: Actualizar CORS

**Ubicación:** `registro-horas-invk-base/backend/server.js`

Es necesario autorizar al nuevo dominio del frontend para que pueda hacer peticiones al backend.

**Línea 18 (aprox) - Cambiar:**
```javascript
origin: ['https://v0-invoke-registro-horas-bs.vercel.app']
```

**Por:**
```javascript
// Si tienes una sola URL
origin: ['https://tu-nueva-url-frontend.com']

// Si tienes múltiples URLs (producción y www)
origin: ['https://tu-nueva-url-frontend.com', 'https://www.tu-nueva-url-frontend.com']
```

---

## 10.3: Configuración del Frontend

Esta fase requiere actualizar tanto las variables de entorno como múltiples archivos donde la URL del backend fue "hardcodeada" (escrita directamente en el código).

### Paso 3.1: Variable de entorno local

**Ubicación:** `registro-horas-invk-base/frontend/registro-horas/.env.local`

Crea o edita este archivo:
```env
NEXT_PUBLIC_BACKEND_URL=https://tu-nueva-url-backend.com
```

### Paso 3.2: Refactorización de URLs Hardcodeadas

Debes buscar y reemplazar todas las ocurrencias de `https://backend-invoke.azurewebsites.net` por tu nueva URL o la variable de entorno.

**Lista de archivos a modificar:**

| Archivo | Líneas Aprox. | Acción |
|---------|--------------|--------|
| `lib/auth.ts` | 27 | Actualizar fallback de BACKEND_URL |
| `components/hour-registration-form.tsx` | 176, 207, 281, 461 | Actualizar constante backendUrl |
| `app/dashboard/perfil/page.tsx` | 22 | Actualizar fallback |
| `app/dashboard/mis-registros/page.tsx` | 136, 216, 299, 338 | Actualizar constante backendUrl |
| `app/dashboard/gestion-parametros/page.tsx` | 347, 432, 479, 526, 952 | Actualizar constante backendUrl |
| `app/dashboard/registros-admin/page.tsx` | 97 | Actualizar constante backendUrl |
| `app/dashboard/usuarios-pendientes/page.tsx` | 37 | Actualizar constante backendUrl |
| `app/dashboard/horas-por-usuario/page.tsx` | 196, 234 | Atención: En línea 196 cambiar URL completa |
| `app/dashboard/gestion-usuarios/page.tsx` | 85, 123, 168, 194 | Cambiar string por template literal (ver abajo) |
| `app/dashboard-home.tsx` | 323, 356, 382, 439-445 | Reemplazo masivo de URL |

**Detalle de cambios específicos:**

Para `app/dashboard/gestion-usuarios/page.tsx`: Cambiar:

```typescript
"https://backend-invoke.azurewebsites.net/api/users"
```

Por:
```typescript
`${process.env.NEXT_PUBLIC_BACKEND_URL || "tu-nueva-url"}/api/users`
```

---

## 10.4: Verificación y Despliegue

### Paso 4.1: Verificar Backend Localmente

**Ubicación:** `registro-horas-invk-base/backend`

Instala dependencias y corre el servidor:

```bash
npm install
npm start
```

Verifica en la consola que la conexión a la base de datos sea exitosa.
Prueba un endpoint básico (ej. `http://localhost:5000/` o un health check).

### Paso 4.2: Verificar Frontend Localmente

**Ubicación:** `registro-horas-invk-base/frontend/registro-horas`

Instala dependencias y corre el modo desarrollo:

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`.
Intenta hacer Login y registrar una hora para validar la conexión completa (BD → Backend → Frontend).

### Paso 4.3: Deployment Final

**Backend Hosting:** Despliega el código y asegura configurar las variables de entorno en el panel del proveedor (especialmente `DATABASE_URL`).

**Frontend Hosting:** Despliega el código y configura la variable `NEXT_PUBLIC_BACKEND_URL` apuntando a tu backend ya desplegado.

---

## 📝 Resumen de Cambios

| Componente | Archivo / Ubicación | Qué cambiar |
|------------|---------------------|-------------|
| Base de Datos | Supabase Dashboard / CLI | Exportar de instancia actual, Importar a nueva |
| Backend | `backend/.env` | `DATABASE_URL` con nueva cadena de conexión |
| Backend | `backend/server.js` (Línea 18) | URL del frontend en configuración CORS |
| Frontend | `frontend/.../.env.local` | `NEXT_PUBLIC_BACKEND_URL` con nueva URL del backend |
| Frontend | 10 Archivos específicos (ver 10.3) | Reemplazar URLs hardcodeadas de Azure por la nueva |

---


