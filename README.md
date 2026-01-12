# INVOKE - Sistema de Registro de Horas

Sistema empresarial completo para el registro, gestión y reporte de horas trabajadas por consultores y administradores.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Roles y Permisos](#roles-y-permisos)
- [Despliegue](#despliegue)
- [Desarrollo](#desarrollo)
- [Contribución](#contribución)

## 🎯 Descripción

INVOKE es una aplicación web full-stack diseñada para gestionar el registro de horas trabajadas por consultores en diferentes proyectos. El sistema permite a los administradores gestionar usuarios, proyectos, generar reportes y exportar datos, mientras que los consultores pueden registrar sus horas de trabajo de manera eficiente.

## ✨ Características

### Para Consultores
- ✅ Registro de horas con descripción de tareas
- ✅ Visualización de registros personales con calendario
- ✅ Dashboard personal con estadísticas
- ✅ Gestión de perfil de usuario
- ✅ Registro de asistencia remota

### Para Administradores
- ✅ Gestión completa de usuarios (crear, editar, aprobar)
- ✅ Gestión de proyectos y clientes
- ✅ Gestión de parámetros del sistema (tipos de horas, países, PMs)
- ✅ Visualización de todos los registros con filtros avanzados
- ✅ Reportes y análisis por usuario
- ✅ Exportación de datos a Excel y Smartsheet
- ✅ Dashboard administrativo con métricas
- ✅ Gestión de vacaciones
- ✅ Aprobación de usuarios pendientes

### Funcionalidades Generales
- 🔐 Autenticación segura con JWT
- 🌙 Modo oscuro/claro
- 📱 Diseño responsive
- 🎨 Interfaz moderna con shadcn/ui
- 📊 Gráficos y visualizaciones interactivas
- 🔍 Búsqueda y filtros avanzados
- 📤 Exportación de datos

## 🛠 Tecnologías

### Backend
- **Node.js** (v18+)
- **Express.js** (v5.1.0)
- **PostgreSQL** (v15)
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **CORS** para manejo de peticiones cross-origin

### Frontend
- **Next.js** (v15.2.4)
- **React** (v19)
- **TypeScript** (v5)
- **TailwindCSS** (v3.4.17)
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Recharts** - Gráficos y visualizaciones
- **date-fns** - Manejo de fechas
- **Lucide React** - Iconos

### Infraestructura
- **Docker** y **Docker Compose** (desarrollo local)
- **Supabase** - Base de datos PostgreSQL en la nube
- **Azure** - Hosting del backend (producción)
- **Vercel** - Hosting del frontend (producción)

## 📁 Estructura del Proyecto

```
invoke-registro-horas/
├── registro-horas-invk-base/
│   ├── backend/
│   │   ├── config/
│   │   │   └── db.js              # Configuración de PostgreSQL
│   │   ├── controllers/
│   │   │   └── users.js           # Controladores de usuarios
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js  # Middleware de autenticación
│   │   │   ├── checkRole.js       # Verificación de roles
│   │   │   └── requireAdmin.js    # Requerimiento de admin
│   │   ├── routes/
│   │   │   ├── auth.js            # Rutas de autenticación
│   │   │   ├── users.js           # Rutas de usuarios
│   │   │   ├── hours.js           # Rutas de registro de horas
│   │   │   ├── projects.js        # Rutas de proyectos
│   │   │   ├── reportes.js        # Rutas de reportes
│   │   │   ├── dashboard.js       # Rutas de dashboard
│   │   │   ├── catalog.js         # Rutas de catálogos
│   │   │   ├── parametros.js      # Rutas de parámetros
│   │   │   ├── vacations.js       # Rutas de vacaciones
│   │   │   └── attendance_remoto.js # Rutas de asistencia remota
│   │   ├── Dockerfile
│   │   ├── init.sql               # Script de inicialización de BD
│   │   ├── server.js              # Servidor principal
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── Dockerfile
│   │   └── registro-horas/
│   │       ├── app/
│   │       │   ├── dashboard/     # Páginas del dashboard
│   │       │   │   ├── registro/
│   │       │   │   ├── mis-registros/
│   │       │   │   ├── reportes/
│   │       │   │   ├── gestion-usuarios/
│   │       │   │   ├── gestion-parametros/
│   │       │   │   └── ...
│   │       │   ├── login/
│   │       │   ├── layout.tsx
│   │       │   └── page.tsx
│   │       ├── components/        # Componentes React
│   │       │   ├── ui/            # Componentes shadcn/ui
│   │       │   ├── app-sidebar.tsx
│   │       │   ├── hour-registration-form.tsx
│   │       │   └── ...
│   │       ├── contexts/
│   │       │   └── auth-context.tsx
│   │       ├── lib/
│   │       │   ├── auth.ts
│   │       │   ├── utils.ts
│   │       │   ├── excel-export.ts
│   │       │   └── smartsheet-export.ts
│   │       ├── hooks/
│   │       └── public/            # Assets estáticos
│   │
│   └── docker-compose.yml
└── README.md
```

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior)
- **npm** o **pnpm** (recomendado)
- **Docker** y **Docker Compose** (para despliegue con contenedores)
- **PostgreSQL** (si no usas Docker)
- **Git**

## 🚀 Instalación

### Opción 1: Con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd invoke-registro-horas
```

2. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
# Backend
DATABASE_URL=postgresql://postgres:postgres@db_registro_horas:5432/postgres
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui
PORT=5000
DAILY_GOAL_HOURS=8

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

3. **Construir y ejecutar con Docker Compose**
```bash
cd registro-horas-invk-base
docker-compose up --build
```

Esto iniciará:
- Backend en `http://localhost:5000`
- Frontend en `http://localhost:3000`
- PostgreSQL en puerto `5432`
- pgAdmin en `http://localhost:5055`

### Opción 2: Instalación Local

#### Backend

1. **Navegar al directorio del backend**
```bash
cd registro-horas-invk-base/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**
   - Crear base de datos PostgreSQL
   - Ejecutar `init.sql` para crear las tablas iniciales
   - Configurar `DATABASE_URL` en `.env`

4. **Iniciar servidor**
```bash
npm run dev  # Modo desarrollo con nodemon
# o
npm start    # Modo producción
```

#### Frontend

1. **Navegar al directorio del frontend**
```bash
cd registro-horas-invk-base/frontend/registro-horas
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Configurar variables de entorno**
Crear `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

4. **Iniciar servidor de desarrollo**
```bash
pnpm dev
# o
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## ⚙️ Configuración

### Variables de Entorno

#### Backend (.env)
```env
# Conexión a Supabase (formato de connection string de Supabase)
DATABASE_URL=postgresql://postgres.proyecto:contraseña@host.supabase.co:5432/postgres
JWT_SECRET=tu_secreto_jwt_muy_seguro_minimo_32_caracteres
JWT_EXPIRES_IN=1d
PORT=5000
DAILY_GOAL_HOURS=8
NODE_ENV=development
```

**Nota:** La `DATABASE_URL` debe ser la cadena de conexión proporcionada por Supabase. Puedes encontrarla en el Dashboard de Supabase → Database → Settings → Connection string.

#### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Base de Datos

El sistema utiliza **PostgreSQL** alojado en **Supabase** con las siguientes tablas principales:
- `users` - Usuarios del sistema
- `roles` - Roles (consultor, administrador)
- `work_hours` - Registros de horas trabajadas
- `parametros` - Catálogos (proyectos, tipos de horas, países, PMs)
- `vacations` - Gestión de vacaciones
- `attendance_remoto` - Asistencia remota

**Nota:** Para migrar la base de datos a una nueva instancia de Supabase, consulta el archivo `PLAN_MIGRACION.md`.

## 📖 Uso

### Inicio de Sesión

El sistema incluye credenciales de demostración:

**Administrador:**
- Email: `admin@demo.com`
- Contraseña: `admin123`

**Consultor:**
- Email: `consultor@demo.com`
- Contraseña: `consultor123`

### Registro de Horas

1. Navegar a **"Registro de Horas"** en el menú lateral
2. Seleccionar fecha, proyecto, tipo de hora y país
3. Ingresar cantidad de horas y descripción de la tarea
4. Guardar el registro

### Gestión de Usuarios (Admin)

1. Ir a **"Gestión de Usuarios"**
2. Ver lista de usuarios pendientes de aprobación
3. Aprobar o rechazar usuarios
4. Crear nuevos usuarios manualmente

### Reportes

1. Acceder a **"Reportes"**
2. Seleccionar el tipo de reporte deseado
3. Aplicar filtros (fecha, proyecto, usuario)
4. Exportar a Excel o Smartsheet

## 🔌 API Endpoints

### Autenticación
- `POST /api/users/login` - Iniciar sesión
- `POST /api/users/register` - Registrar nuevo usuario

### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario
- `GET /api/users/pending` - Usuarios pendientes (Admin)
- `PUT /api/users/:id/approve` - Aprobar usuario (Admin)

### Horas
- `GET /api/hours` - Listar registros de horas
- `POST /api/hours` - Crear registro de horas
- `PUT /api/hours/:id` - Actualizar registro
- `DELETE /api/hours/:id` - Eliminar registro
- `GET /api/hours/export` - Exportar registros

### Proyectos
- `GET /api/projects` - Listar proyectos
- `POST /api/projects` - Crear proyecto (Admin)
- `PUT /api/projects/:id` - Actualizar proyecto (Admin)
- `DELETE /api/projects/:id` - Eliminar proyecto (Admin)

### Reportes
- `GET /api/reportes/summary` - Resumen general
- `GET /api/reportes/by-user` - Reporte por usuario
- `GET /api/reportes/by-project` - Reporte por proyecto

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas del dashboard
- `GET /api/dashboard/project-hours` - Horas por proyecto

### Parámetros
- `GET /api/parametros` - Listar parámetros
- `POST /api/parametros` - Crear parámetro (Admin)
- `PUT /api/parametros/:id` - Actualizar parámetro (Admin)
- `DELETE /api/parametros/:id` - Eliminar parámetro (Admin)

### Vacaciones
- `GET /api/vacations` - Listar vacaciones
- `POST /api/vacations` - Solicitar vacaciones
- `PUT /api/vacations/:id` - Actualizar solicitud
- `DELETE /api/vacations/:id` - Eliminar solicitud

### Asistencia Remota
- `GET /api/attendance` - Listar asistencias
- `POST /api/attendance` - Registrar asistencia remota

## 👥 Roles y Permisos

### Consultor
- ✅ Registrar horas propias
- ✅ Ver sus propios registros
- ✅ Ver su perfil
- ✅ Ver dashboard personal
- ❌ Gestión de usuarios
- ❌ Gestión de proyectos
- ❌ Ver reportes administrativos

### Administrador
- ✅ Todas las funciones de consultor
- ✅ Gestión completa de usuarios
- ✅ Gestión de proyectos y parámetros
- ✅ Ver todos los registros
- ✅ Generar reportes
- ✅ Exportar datos
- ✅ Aprobar usuarios pendientes

## 🚢 Despliegue

### Despliegue con Docker

1. **Construir imágenes**
```bash
docker-compose build
```

2. **Iniciar servicios**
```bash
docker-compose up -d
```

3. **Ver logs**
```bash
docker-compose logs -f
```

### Despliegue en Producción

#### Backend (Azure)

1. Configurar variables de entorno en Azure Portal:
   - `DATABASE_URL` - Cadena de conexión de Supabase
   - `JWT_SECRET` - Secreto para tokens JWT
   - `JWT_EXPIRES_IN` - Tiempo de expiración (ej: 1d)
   - `NODE_ENV=production`
2. Conectar a base de datos Supabase
3. Desplegar aplicación Node.js
4. Configurar CORS en `server.js` con la URL del frontend en producción

#### Frontend (Vercel)

1. Conectar repositorio Git a Vercel
2. Configurar variables de entorno:
   - `NEXT_PUBLIC_BACKEND_URL` - URL del backend en producción (ej: `https://backend-invoke.azurewebsites.net`)
3. Configurar build command: `pnpm build`
4. Desplegar

**Importante:** Asegúrate de que todas las URLs hardcodeadas en el código hayan sido reemplazadas por variables de entorno. Consulta `PLAN_MIGRACION.md` para más detalles.

### Variables de Entorno en Producción

Asegúrate de configurar:
- `DATABASE_URL` con credenciales de producción
- `JWT_SECRET` fuerte y único
- `NEXT_PUBLIC_BACKEND_URL` apuntando al backend en producción
- `NODE_ENV=production`

## 💻 Desarrollo

### Scripts Disponibles

#### Backend
```bash
npm start      # Iniciar servidor en producción
npm run dev    # Iniciar servidor en desarrollo (nodemon)
```

#### Frontend
```bash
pnpm dev       # Servidor de desarrollo
pnpm build     # Construir para producción
pnpm start     # Iniciar servidor de producción
pnpm lint      # Ejecutar linter
```

### Estructura de Código

- **Backend**: JavaScript (CommonJS)
- **Frontend**: TypeScript con Next.js App Router
- **Estilos**: TailwindCSS con componentes de shadcn/ui
- **Validación**: Zod para esquemas de validación

