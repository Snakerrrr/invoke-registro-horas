# ✅ Checklist Detallado de Migración

## 📋 FASE 1: PREPARACIÓN (Antes de Empezar)

### 1.1 Inventario y Documentación
- [ ] **Backup completo de código fuente**
  - [ ] Repositorio Git clonado y respaldado
  - [ ] Tag de versión actual creado
  - [ ] Branch de migración creado

- [ ] **Base de datos actual**
  - [ ] Backup completo exportado (`backup_completo.sql`)
  - [ ] Esquema exportado (`schema.sql`)
  - [ ] Datos exportados (`data.sql`)
  - [ ] Lista de tablas documentada
  - [ ] Lista de usuarios/roles documentada
  - [ ] Datos de referencia exportados (países, proyectos, tipos de hora)

- [ ] **Configuración actual**
  - [ ] Variables de entorno documentadas
  - [ ] URLs de producción documentadas
  - [ ] Credenciales de acceso documentadas (en gestor seguro)
  - [ ] Configuración de CORS documentada

- [ ] **Dependencias**
  - [ ] Versión de Node.js: `18.x` ✅
  - [ ] Versión de PostgreSQL: `15.x` ✅
  - [ ] Lista de paquetes npm documentada
  - [ ] Lista de paquetes pnpm documentada

---

## 📋 FASE 2: CONFIGURACIÓN DEL NUEVO ENTORNO

### 2.1 Infraestructura Backend
- [ ] **Servidor/Plataforma seleccionada**
  - [ ] Opción elegida: _______________________
  - [ ] Cuenta creada y verificada
  - [ ] Facturación configurada

- [ ] **Node.js**
  - [ ] Node.js 18+ instalado
  - [ ] Versión verificada: `node -v`
  - [ ] npm/pnpm instalado

- [ ] **Base de Datos PostgreSQL**
  - [ ] PostgreSQL 15+ instalado/configurado
  - [ ] Base de datos creada
  - [ ] Usuario de aplicación creado
  - [ ] Permisos configurados
  - [ ] Conexión probada desde servidor backend

- [ ] **Variables de Entorno Backend**
  - [ ] `DATABASE_URL` configurada
  - [ ] `JWT_SECRET` generado (mínimo 32 caracteres)
  - [ ] `JWT_EXPIRES_IN` configurado
  - [ ] `PORT` configurado
  - [ ] `NODE_ENV` configurado
  - [ ] `DAILY_GOAL_HOURS` configurado
  - [ ] `ALLOWED_ORIGINS` configurado

- [ ] **Seguridad Backend**
  - [ ] SSL/HTTPS configurado
  - [ ] Firewall configurado
  - [ ] Rate limiting configurado (recomendado)
  - [ ] Logs configurados

### 2.2 Infraestructura Frontend
- [ ] **Plataforma de Hosting**
  - [ ] Opción elegida: _______________________
  - [ ] Cuenta creada y verificada
  - [ ] Proyecto creado

- [ ] **Variables de Entorno Frontend**
  - [ ] `NEXT_PUBLIC_BACKEND_URL` configurada
  - [ ] Variables configuradas en plataforma

- [ ] **Dominio y SSL**
  - [ ] Dominio configurado
  - [ ] SSL/HTTPS activado
  - [ ] DNS configurado correctamente

### 2.3 Base de Datos
- [ ] **Preparación**
  - [ ] Backup de base de datos actual guardado en lugar seguro
  - [ ] Plan de rollback documentado
  - [ ] Ventana de mantenimiento programada (si aplica)

---

## 📋 FASE 3: MIGRACIÓN DE BASE DE DATOS

### 3.1 Exportación
- [ ] **Backup Completo**
  ```bash
  pg_dump -h host_actual -U usuario -d nombre_db > backup_completo_$(date +%Y%m%d).sql
  ```
  - [ ] Backup completado
  - [ ] Tamaño del backup verificado
  - [ ] Backup guardado en múltiples ubicaciones

- [ ] **Verificación de Exportación**
  - [ ] Archivo de backup no está vacío
  - [ ] Estructura de tablas presente
  - [ ] Datos presentes

### 3.2 Importación
- [ ] **Preparación Nueva Base de Datos**
  - [ ] Base de datos creada
  - [ ] Usuario con permisos creado
  - [ ] Conexión probada

- [ ] **Importación de Esquema**
  ```bash
  psql -h nuevo_host -U nuevo_usuario -d nombre_db_nueva < schema.sql
  ```
  - [ ] Esquema importado sin errores
  - [ ] Todas las tablas creadas
  - [ ] Constraints y foreign keys creados
  - [ ] Índices creados

- [ ] **Importación de Datos**
  ```bash
  psql -h nuevo_host -U nuevo_usuario -d nombre_db_nueva < data.sql
  ```
  - [ ] Datos importados sin errores
  - [ ] Conteo de registros verificado
  - [ ] Integridad referencial verificada

### 3.3 Verificación Post-Importación
- [ ] **Verificación de Tablas**
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```
  - [ ] Número de tablas coincide con original
  - [ ] Tablas críticas presentes:
    - [ ] `users`
    - [ ] `work_hours`
    - [ ] `parametros`
    - [ ] `roles`
    - [ ] `attendance_reports`

- [ ] **Verificación de Datos**
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM work_hours;
  SELECT COUNT(*) FROM parametros;
  ```
  - [ ] Conteos coinciden con base de datos original
  - [ ] Datos de prueba verificados manualmente

- [ ] **Verificación de Relaciones**
  - [ ] Foreign keys funcionan
  - [ ] Constraints activos
  - [ ] Índices creados

---

## 📋 FASE 4: ACTUALIZACIÓN DE CÓDIGO

### 4.1 Backend
- [ ] **Código Actualizado**
  - [ ] `server.js` - CORS actualizado para usar variables de entorno
  - [ ] Todas las referencias a URLs hardcodeadas eliminadas
  - [ ] Variables de entorno validadas al inicio

- [ ] **Archivos Modificados**
  - [ ] `backend/server.js` - CORS dinámico
  - [ ] Verificar que no hay más URLs hardcodeadas

- [ ] **Testing Local**
  - [ ] Backend inicia correctamente
  - [ ] Conexión a nueva base de datos exitosa
  - [ ] Endpoints responden correctamente
  - [ ] Autenticación funciona

### 4.2 Frontend
- [ ] **Código Actualizado**
  - [ ] Archivo `lib/config.ts` creado
  - [ ] `lib/auth.ts` actualizado
  - [ ] `components/hour-registration-form.tsx` actualizado
  - [ ] `app/dashboard/perfil/page.tsx` actualizado
  - [ ] `app/dashboard/mis-registros/page.tsx` actualizado
  - [ ] `app/dashboard/gestion-parametros/page.tsx` actualizado
  - [ ] `app/dashboard/registros-admin/page.tsx` actualizado
  - [ ] `app/dashboard/usuarios-pendientes/page.tsx` actualizado
  - [ ] `app/dashboard/horas-por-usuario/page.tsx` actualizado

- [ ] **Búsqueda de URLs Hardcodeadas**
  ```bash
  grep -r "backend-invoke.azurewebsites.net" frontend/
  grep -r "v0-invoke-registro-horas-bs.vercel.app" frontend/
  ```
  - [ ] Todas las ocurrencias encontradas y reemplazadas
  - [ ] Build exitoso sin errores

- [ ] **Testing Local**
  - [ ] Frontend build exitoso (`pnpm build`)
  - [ ] Frontend inicia correctamente
  - [ ] Conexión al backend funciona
  - [ ] Login funciona end-to-end

---

## 📋 FASE 5: DEPLOYMENT

### 5.1 Backend Deployment
- [ ] **Pre-Deployment**
  - [ ] Código en branch de producción
  - [ ] Tests pasan (si existen)
  - [ ] Variables de entorno configuradas en plataforma
  - [ ] Build local exitoso

- [ ] **Deployment**
  - [ ] Código desplegado
  - [ ] Servicio iniciado
  - [ ] Health check exitoso
  - [ ] Logs verificados

- [ ] **Post-Deployment**
  - [ ] Endpoint `/` responde
  - [ ] Endpoint `/api/users/login` funciona
  - [ ] Conexión a base de datos verificada
  - [ ] CORS configurado correctamente

### 5.2 Frontend Deployment
- [ ] **Pre-Deployment**
  - [ ] Código en branch de producción
  - [ ] Build local exitoso
  - [ ] Variables de entorno configuradas
  - [ ] URLs actualizadas

- [ ] **Deployment**
  - [ ] Build en plataforma exitoso
  - [ ] Deploy completado
  - [ ] URL de producción accesible

- [ ] **Post-Deployment**
  - [ ] Página principal carga
  - [ ] Variables de entorno cargadas
  - [ ] Conexión al backend funciona

### 5.3 Verificación de Integración
- [ ] **End-to-End Testing**
  - [ ] Login funciona desde frontend
  - [ ] Registro de horas funciona
  - [ ] Dashboard carga datos
  - [ ] Reportes se generan
  - [ ] Exportaciones funcionan

---

## 📋 FASE 6: TESTING Y VALIDACIÓN

### 6.1 Testing Funcional
- [ ] **Autenticación**
  - [ ] Login funciona
  - [ ] Logout funciona
  - [ ] Token refresh funciona
  - [ ] Rutas protegidas funcionan

- [ ] **Registro de Horas**
  - [ ] Formulario carga parámetros
  - [ ] Registro de horas funciona
  - [ ] Validaciones funcionan
  - [ ] Último registro se muestra

- [ ] **Gestión de Usuarios (Admin)**
  - [ ] Listado de usuarios funciona
  - [ ] Creación de usuarios funciona
  - [ ] Edición de usuarios funciona
  - [ ] Eliminación de usuarios funciona

- [ ] **Gestión de Parámetros (Admin)**
  - [ ] CRUD de países funciona
  - [ ] CRUD de proyectos funciona
  - [ ] CRUD de tipos de hora funciona
  - [ ] CRUD de PMs funciona

- [ ] **Reportes**
  - [ ] Dashboard summary funciona
  - [ ] Reportes consolidados funcionan
  - [ ] Exportaciones funcionan
  - [ ] Filtros funcionan

### 6.2 Testing de Performance
- [ ] **Backend**
  - [ ] Tiempo de respuesta < 500ms (endpoints simples)
  - [ ] Tiempo de respuesta < 2s (endpoints complejos)
  - [ ] Base de datos responde rápidamente

- [ ] **Frontend**
  - [ ] Tiempo de carga inicial < 3s
  - [ ] Navegación fluida
  - [ ] Sin errores en consola

### 6.3 Testing de Seguridad
- [ ] **Autenticación**
  - [ ] Tokens expiran correctamente
  - [ ] Rutas protegidas bloquean acceso no autorizado
  - [ ] Roles funcionan correctamente

- [ ] **CORS**
  - [ ] Solo dominios permitidos pueden acceder
  - [ ] Requests desde otros dominios son bloqueados

- [ ] **SQL Injection**
  - [ ] Vulnerabilidades corregidas (especialmente `reportes.js:18`)

---

## 📋 FASE 7: MONITOREO Y DOCUMENTACIÓN

### 7.1 Monitoreo
- [ ] **Backend**
  - [ ] Logs configurados
  - [ ] Alertas configuradas
  - [ ] Health checks configurados
  - [ ] Métricas configuradas (opcional)

- [ ] **Frontend**
  - [ ] Error tracking configurado (Sentry, etc.)
  - [ ] Analytics configurado (opcional)

- [ ] **Base de Datos**
  - [ ] Backups automatizados configurados
  - [ ] Monitoreo de espacio configurado
  - [ ] Alertas de conexión configuradas

### 7.2 Documentación
- [ ] **Documentación Técnica**
  - [ ] URLs de producción documentadas
  - [ ] Variables de entorno documentadas
  - [ ] Estructura de base de datos documentada
  - [ ] Endpoints documentados
  - [ ] Proceso de deployment documentado

- [ ] **Documentación de Usuario**
  - [ ] Guía de uso actualizada
  - [ ] Cambios notificados al equipo

### 7.3 Plan de Rollback
- [ ] **Preparación**
  - [ ] Backup de código anterior guardado
  - [ ] Backup de base de datos anterior guardado
  - [ ] Procedimiento de rollback documentado

- [ ] **Procedimiento Documentado**
  - [ ] Pasos para revertir backend
  - [ ] Pasos para revertir frontend
  - [ ] Pasos para restaurar base de datos
  - [ ] Contactos de emergencia

---

## 📋 FASE 8: CORTE Y GO-LIVE

### 8.1 Pre-Corte
- [ ] **Comunicación**
  - [ ] Equipo notificado de la migración
  - [ ] Ventana de mantenimiento comunicada (si aplica)
  - [ ] Usuarios finales notificados (si aplica)

- [ ] **Preparación Final**
  - [ ] Todos los tests pasan
  - [ ] Backup final de producción realizado
  - [ ] Equipo de soporte disponible

### 8.2 Corte
- [ ] **Ejecución**
  - [ ] Migración de base de datos ejecutada
  - [ ] Deployment de backend ejecutado
  - [ ] Deployment de frontend ejecutado
  - [ ] DNS actualizado (si aplica)

- [ ] **Verificación Inmediata**
  - [ ] Health checks pasan
  - [ ] Login funciona
  - [ ] Funcionalidad crítica verificada

### 8.3 Post-Corte
- [ ] **Monitoreo Intensivo (Primeras 24h)**
  - [ ] Logs monitoreados constantemente
  - [ ] Errores reportados y resueltos
  - [ ] Performance monitoreada

- [ ] **Seguimiento (Primera Semana)**
  - [ ] Revisión diaria de logs
  - [ ] Feedback de usuarios recopilado
  - [ ] Issues documentados y resueltos

---

## 🔴 PUNTOS CRÍTICOS (Revisar ANTES de Migrar)

### Seguridad
- [ ] **SQL Injection corregido**
  - Archivo: `backend/routes/reportes.js:18`
  - Estado: ⚠️ **PENDIENTE** - Corregir antes de migrar

- [ ] **Secrets Management**
  - [ ] `.env` files en `.gitignore`
  - [ ] Secrets en gestor seguro (no en código)
  - [ ] JWT_SECRET fuerte generado

### Configuración
- [ ] **CORS Configurado Correctamente**
  - [ ] Solo dominios de producción permitidos
  - [ ] Credentials configurados si es necesario

- [ ] **HTTPS Obligatorio**
  - [ ] Backend con SSL
  - [ ] Frontend con SSL
  - [ ] Redirección HTTP → HTTPS

### Base de Datos
- [ ] **Backups Automatizados**
  - [ ] Configurados en nueva infraestructura
  - [ ] Frecuencia definida
  - [ ] Retención definida

---

## 📊 MÉTRICAS DE ÉXITO

### Post-Migración (Primera Semana)
- [ ] **Uptime**: > 99.5%
- [ ] **Tiempo de Respuesta**: < 500ms (p95)
- [ ] **Errores**: < 0.1% de requests
- [ ] **Satisfacción Usuario**: Sin quejas críticas

### Indicadores de Problemas
- [ ] Tiempo de respuesta > 2s
- [ ] Tasa de error > 1%
- [ ] Caídas del servicio
- [ ] Pérdida de datos

---

## 📝 NOTAS ADICIONALES

### Fecha de Migración Programada
- Fecha: _______________________
- Hora: _______________________
- Duración estimada: _______________________

### Equipo Responsable
- Líder de Migración: _______________________
- Backend Developer: _______________________
- Frontend Developer: _______________________
- DBA: _______________________
- DevOps: _______________________

### Contactos de Emergencia
- Backend: _______________________
- Frontend: _______________________
- Base de Datos: _______________________
- Infraestructura: _______________________

---

## ✅ FIRMA DE APROBACIÓN

- [ ] **Preparación Completa**: _______________________ (Fecha)
- [ ] **Código Listo**: _______________________ (Fecha)
- [ ] **Infraestructura Lista**: _______________________ (Fecha)
- [ ] **Testing Completo**: _______________________ (Fecha)
- [ ] **Aprobación para Migración**: _______________________ (Fecha)

---

**Versión del Checklist**: 1.0  
**Última Actualización**: Generado automáticamente
