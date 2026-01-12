const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

// GET /api/reportes/usuarios-pendientes
router.get('/usuarios-pendientes', authMiddleware, requireAdmin, async (req, res) => {
  const { days = 4 } = req.query;

  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, MAX(wh.date) AS last_date
      FROM users u
      LEFT JOIN work_hours wh ON u.id = wh.user_id
      WHERE u.role = 'consultor'
      GROUP BY u.id
      HAVING MAX(wh.date) IS NULL OR MAX(wh.date) < CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY last_date NULLS FIRST
    `);

    const usuarios = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      last_date: row.last_date,
      days_since: row.last_date
        ? Math.floor((new Date() - new Date(row.last_date)) / (1000 * 60 * 60 * 24))
        : null
    }));

    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios pendientes' });
  }
});

// GET /api/reportes/test - Endpoint de prueba simple
router.get('/test', authMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log('Test endpoint - Iniciando...');
    res.json({ 
      message: 'Test endpoint funcionando',
      timestamp: new Date().toISOString(),
      user: req.user
    });
  } catch (error) {
    console.error('Error en test endpoint:', error);
    res.status(500).json({ message: 'Error en test endpoint', error: error.message });
  }
});

// GET /api/reportes/dashboard-summary - Resumen ejecutivo unificado
router.get('/dashboard-summary', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id, project_id, hour_type_id, status } = req.query;
    
    console.log('Dashboard Summary - Parámetros recibidos:', { from, to, user_id, project_id, hour_type_id, status });
    
    // Usar fechas por defecto si no se proporcionan
    const defaultFrom = from || '2025-01-01';
    const defaultTo = to || '2025-12-31';
    
    console.log('Fechas a usar:', { defaultFrom, defaultTo });
    
    // Construir filtros para work_hours
    let hoursWhereClause = 'WHERE wh.date >= $1 AND wh.date <= $2';
    const hoursValues = [defaultFrom, defaultTo];
    let hoursParamIndex = 3;

    if (user_id) {
      hoursWhereClause += ` AND wh.user_id = $${hoursParamIndex}`;
      hoursValues.push(user_id);
      hoursParamIndex++;
    }
    if (project_id) {
      hoursWhereClause += ` AND wh.project_id = $${hoursParamIndex}`;
      hoursValues.push(project_id);
      hoursParamIndex++;
    }
    if (hour_type_id) {
      hoursWhereClause += ` AND wh.hour_type_id = $${hoursParamIndex}`;
      hoursValues.push(hour_type_id);
      hoursParamIndex++;
    }
    
    console.log('Filtros para work_hours:', { hoursWhereClause, hoursValues });
    
    // Construir filtros para attendance_reports
    let attendanceWhereClause = 'WHERE ar.date >= $1 AND ar.date <= $2';
    const attendanceValues = [defaultFrom, defaultTo];
    let attendanceParamIndex = 3;

    if (user_id) {
      attendanceWhereClause += ` AND ar.user_id = $${attendanceParamIndex}`;
      attendanceValues.push(user_id);
      attendanceParamIndex++;
    }
    if (status) {
      attendanceWhereClause += ` AND ar.attendance_status = $${attendanceParamIndex}`;
      attendanceValues.push(status);
      attendanceParamIndex++;
    }
    
    console.log('Filtros para attendance_reports:', { attendanceWhereClause, attendanceValues });

    // 1. Resumen general de horas - Consulta con filtros
    console.log('Ejecutando consulta de resumen de horas...');
    const hoursSummary = await pool.query(`
      SELECT 
        COUNT(DISTINCT wh.user_id) as usuarios_activos,
        COUNT(DISTINCT wh.project_id) as proyectos_activos,
        COALESCE(SUM(wh.hours_quantity), 0) as total_horas,
        COALESCE(AVG(wh.hours_quantity), 0) as promedio_horas_por_registro,
        COUNT(*) as total_registros
      FROM work_hours wh
      ${hoursWhereClause}
    `, hoursValues);

    console.log('Resumen de horas obtenido:', hoursSummary.rows[0]);

    // 2. Resumen de asistencia - Consulta con filtros
    console.log('Ejecutando consulta de resumen de asistencia...');
    const attendanceSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_dias,
        COUNT(CASE WHEN ar.attendance_status = 'presente' THEN 1 END) as dias_presentes,
        COUNT(CASE WHEN ar.attendance_status = 'ausente' THEN 1 END) as dias_ausentes,
        COALESCE(AVG(ar.total_hours_worked), 0) as promedio_horas_trabajadas
      FROM attendance_reports ar
      ${attendanceWhereClause}
    `, attendanceValues);

    console.log('Resumen de asistencia obtenido:', attendanceSummary.rows[0]);

    // 3. Top usuarios por horas - Consulta con filtros
    console.log('Ejecutando consulta de top usuarios...');
    const topUsers = await pool.query(`
      SELECT 
        u.id,
        COALESCE(u.name, 'Usuario sin nombre') as name,
        u.email,
        COALESCE(SUM(wh.hours_quantity), 0) as total_horas,
        COUNT(DISTINCT wh.date) as dias_activos,
        COUNT(*) as total_registros
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      ${hoursWhereClause}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_horas DESC
      LIMIT 5
    `, hoursValues);

    console.log('Top usuarios obtenido:', topUsers.rows.length, 'usuarios');
    console.log('Datos de top usuarios:', JSON.stringify(topUsers.rows, null, 2));

    // 4. Top proyectos por horas - Consulta con filtros
    console.log('Ejecutando consulta de top proyectos...');
    const topProjects = await pool.query(`
      SELECT 
        pr.nombre as proyecto,
        pr.cliente,
        COALESCE(SUM(wh.hours_quantity), 0) as total_horas,
        COUNT(DISTINCT wh.user_id) as usuarios_involucrados
      FROM work_hours wh
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      ${hoursWhereClause}
      GROUP BY pr.id, pr.nombre, pr.cliente
      ORDER BY total_horas DESC
      LIMIT 5
    `, hoursValues);

    console.log('Top proyectos obtenido:', topProjects.rows.length, 'proyectos');

    // 5. Distribución por tipo de hora - Consulta con filtros
    console.log('Ejecutando consulta de distribución por tipo de hora...');
    const hourTypesDistribution = await pool.query(`
      SELECT 
        tp.nombre as tipo_hora,
        COALESCE(SUM(wh.hours_quantity), 0) as total_horas,
        COUNT(*) as cantidad_registros
      FROM work_hours wh
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      ${hoursWhereClause}
      GROUP BY tp.id, tp.nombre
      ORDER BY total_horas DESC
    `, hoursValues);

    console.log('Distribución por tipo de hora obtenida:', hourTypesDistribution.rows.length, 'tipos');

    const response = {
      hoursSummary: hoursSummary.rows[0],
      attendanceSummary: attendanceSummary.rows[0],
      topUsers: topUsers.rows,
      topProjects: topProjects.rows,
      hourTypesDistribution: hourTypesDistribution.rows
    };

    console.log('Respuesta completa preparada:', {
      hoursSummary: response.hoursSummary,
      attendanceSummary: response.attendanceSummary,
      topUsersCount: response.topUsers.length,
      topProjectsCount: response.topProjects.length,
      hourTypesCount: response.hourTypesDistribution.length
    });

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error obteniendo resumen del dashboard',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/reportes/consolidated - Reporte consolidado
router.get('/consolidated', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id, project_id, hour_type_id, status } = req.query;
    
    console.log('Consolidated Report - Parámetros recibidos:', { from, to, user_id, project_id, hour_type_id, status });
    
    // Usar fechas por defecto si no se proporcionan
    const defaultFrom = from || '2025-01-01';
    const defaultTo = to || '2025-12-31';
    
    // Construir filtros para work_hours
    let whereClause = 'WHERE wh.date >= $1 AND wh.date <= $2';
    const values = [defaultFrom, defaultTo];
    let paramIndex = 3;

    if (user_id) {
      whereClause += ` AND wh.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }
    if (project_id) {
      whereClause += ` AND wh.project_id = $${paramIndex}`;
      values.push(project_id);
      paramIndex++;
    }
    if (hour_type_id) {
      whereClause += ` AND wh.hour_type_id = $${paramIndex}`;
      values.push(hour_type_id);
      paramIndex++;
    }

    console.log('Filtros construidos para work_hours:', { whereClause, values });

    // Reporte consolidado de horas
    console.log('Ejecutando consulta de horas consolidadas...');
    const consolidatedHours = await pool.query(`
      SELECT 
        wh.id,
        wh.date,
        u.name as user_name,
        u.email,
        pr.nombre as project_name,
        pr.cliente,
        tp.nombre as hour_type_name,
        cp.nombre as country_name,
        wh.hours_quantity,
        wh.task_description,
        wh.created_at,
        -- Información de asistencia si existe
        ar.attendance_status,
        ar.total_hours_worked as attendance_hours,
        ar.first_entry_time,
        ar.last_exit_time
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN parametros cp ON wh.country_id = cp.id AND cp.tipo = 'pais'
      LEFT JOIN attendance_reports ar ON wh.user_id = ar.user_id AND wh.date = ar.date
      ${whereClause}
      ORDER BY wh.date DESC, u.name
      LIMIT 100
    `, values);

    console.log('Horas consolidadas obtenidas:', consolidatedHours.rows.length, 'registros');

    // Construir filtros para attendance_reports
    let attendanceWhereClause = "WHERE u.role != 'administrador' AND ar.date >= $1 AND ar.date <= $2";
    const attendanceValues = [defaultFrom, defaultTo];
    let attendanceParamIndex = 3;

    if (user_id) {
      attendanceWhereClause += ` AND ar.user_id = $${attendanceParamIndex}`;
      attendanceValues.push(user_id);
      attendanceParamIndex++;
    }
    if (status) {
      attendanceWhereClause += ` AND ar.attendance_status = $${attendanceParamIndex}`;
      attendanceValues.push(status);
      attendanceParamIndex++;
    }

    console.log('Filtros construidos para attendance_reports:', { attendanceWhereClause, attendanceValues });

    // Reporte de asistencia
    console.log('Ejecutando consulta de reporte de asistencia...');
    const attendanceReport = await pool.query(`
      SELECT 
        ar.date,
        u.name as user_name,
        u.email,
        ar.attendance_status,
        ar.total_hours_worked,
        ar.first_entry_time,
        ar.last_exit_time,
        ac.timezone
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN attendance_config ac ON ar.user_id = ac.user_id
      ${attendanceWhereClause}
      ORDER BY ar.date DESC, u.name
      LIMIT 100
    `, attendanceValues);

    console.log('Reporte de asistencia obtenido:', attendanceReport.rows.length, 'registros');

    // Construir filtros para attendance_exceptions
    let exceptionsWhereClause = 'WHERE ae.date >= $1 AND ae.date <= $2';
    const exceptionsValues = [defaultFrom, defaultTo];
    let exceptionsParamIndex = 3;

    if (user_id) {
      exceptionsWhereClause += ` AND ae.user_id = $${exceptionsParamIndex}`;
      exceptionsValues.push(user_id);
      exceptionsParamIndex++;
    }

    console.log('Filtros construidos para attendance_exceptions:', { exceptionsWhereClause, exceptionsValues });

    // Excepciones de asistencia
    console.log('Ejecutando consulta de excepciones de asistencia...');
    const attendanceExceptions = await pool.query(`
      SELECT 
        ae.id,
        u.name as user_name,
        u.email,
        ae.date,
        ae.status,
        ae.reason,
        ae.created_at
      FROM attendance_exceptions ae
      JOIN users u ON ae.user_id = u.id
      ${exceptionsWhereClause}
      ORDER BY ae.date DESC, u.name
      LIMIT 50
    `, exceptionsValues);

    console.log('Excepciones de asistencia obtenidas:', attendanceExceptions.rows.length, 'registros');

    const response = {
      hoursReport: consolidatedHours.rows,
      attendanceReport: attendanceReport.rows,
      attendanceExceptions: attendanceExceptions.rows,
      summary: {
        totalHours: consolidatedHours.rows.reduce((sum, row) => sum + parseFloat(row.hours_quantity || 0), 0),
        totalRecords: consolidatedHours.rows.length,
        uniqueUsers: [...new Set(consolidatedHours.rows.map(row => row.user_name))].length,
        uniqueProjects: [...new Set(consolidatedHours.rows.map(row => row.project_name))].length
      }
    };

    console.log('Respuesta consolidada preparada:', {
      hoursReportCount: response.hoursReport.length,
      attendanceReportCount: response.attendanceReport.length,
      exceptionsCount: response.attendanceExceptions.length,
      summary: response.summary
    });

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo reporte consolidado:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error obteniendo reporte consolidado',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/reportes/export-hours - Solo registros de horas
router.get('/export-hours', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id, project_id, hour_type_id } = req.query;
    
    console.log('Export Hours - Parámetros recibidos:', { from, to, user_id, project_id, hour_type_id });
    
    // Construir filtros
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (from) {
      whereClause += ` AND wh.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }
    if (to) {
      whereClause += ` AND wh.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }
    if (user_id) {
      whereClause += ` AND wh.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }
    if (project_id) {
      whereClause += ` AND wh.project_id = $${paramIndex}`;
      values.push(project_id);
      paramIndex++;
    }
    if (hour_type_id) {
      whereClause += ` AND wh.hour_type_id = $${paramIndex}`;
      values.push(hour_type_id);
      paramIndex++;
    }

    console.log('Filtros construidos para work_hours:', { whereClause, values });

    // Obtener datos de horas
    const hoursData = await pool.query(`
      SELECT 
        wh.id as id_registro,
        TO_CHAR(wh.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email as consultor_email,
        pr.nombre as project_name,
        pr.cliente as client_name,
        pm.nombre as product_manager_name,
        tp.nombre as hour_type_name,
        cp.nombre as country_name,
        wh.hours_quantity as horas,
        wh.task_description as descripcion,
        TO_CHAR(wh.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      LEFT JOIN parametros pm ON pr.project_manager_id = pm.id AND pm.tipo = 'pm'
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN parametros cp ON wh.country_id = cp.id AND cp.tipo = 'pais'
      ${whereClause}
      ORDER BY wh.date DESC, u.name
    `, values);

    console.log('Datos de horas obtenidos:', hoursData.rows.length, 'registros');

    // Formatear datos para exportación
    const formattedData = hoursData.rows.map(row => ({
      id: row.id_registro,
      date: row.fecha,
      consultorName: row.consultor,
      consultorEmail: row.consultor_email,
      projectName: row.project_name,
      clientName: row.client_name,
      productManagerName: row.product_manager_name || '',
      hourTypeName: row.hour_type_name,
      countryName: row.country_name,
      hours: row.horas,
      description: row.descripcion,
      createdAt: row.fecha_creacion
    }));

    res.json({
      data: formattedData,
      totalRecords: formattedData.length,
      exportDate: new Date().toISOString(),
      filters: {
        from,
        to,
        user_id,
        project_id,
        hour_type_id
      }
    });
  } catch (error) {
    console.error('Error exportando datos de horas:', error);
    res.status(500).json({ message: 'Error exportando datos de horas' });
  }
});

// GET /api/reportes/export-attendance - Solo registros de asistencia
router.get('/export-attendance', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id, status } = req.query;
    
    console.log('Export Attendance - Parámetros recibidos:', { from, to, user_id, status });
    
    // Construir filtros
    let whereClause = 'WHERE u.role != \'administrador\'';
    const values = [];
    let paramIndex = 1;

    if (from) {
      whereClause += ` AND ar.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }
    if (to) {
      whereClause += ` AND ar.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }
    if (user_id) {
      whereClause += ` AND ar.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }
    if (status) {
      whereClause += ` AND ar.attendance_status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    console.log('Filtros construidos para attendance_reports:', { whereClause, values });

    // Obtener datos de asistencia
    const attendanceData = await pool.query(`
      SELECT 
        ar.id,
        TO_CHAR(ar.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email as consultor_email,
        ar.attendance_status as estado_asistencia,
        ar.total_hours_worked as horas_trabajadas,
        TO_CHAR(ar.first_entry_time, 'HH24:MI:SS') as primera_entrada,
        TO_CHAR(ar.last_exit_time, 'HH24:MI:SS') as ultima_salida,
        ac.timezone as zona_horaria,
        TO_CHAR(ar.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN attendance_config ac ON ar.user_id = ac.user_id
      ${whereClause}
      ORDER BY ar.date DESC, u.name
    `, values);

    console.log('Datos de asistencia obtenidos:', attendanceData.rows.length, 'registros');

    // Formatear datos para exportación
    const formattedData = attendanceData.rows.map(row => ({
      id: row.id,
      date: row.fecha,
      consultorName: row.consultor,
      consultorEmail: row.consultor_email,
      attendanceStatus: row.estado_asistencia,
      hoursWorked: row.horas_trabajadas,
      firstEntry: row.primera_entrada,
      lastExit: row.ultima_salida,
      timezone: row.zona_horaria,
      createdAt: row.fecha_creacion
    }));

    res.json({
      data: formattedData,
      totalRecords: formattedData.length,
      exportDate: new Date().toISOString(),
      filters: {
        from,
        to,
        user_id,
        status
      }
    });
  } catch (error) {
    console.error('Error exportando datos de asistencia:', error);
    res.status(500).json({ message: 'Error exportando datos de asistencia' });
  }
});

// GET /api/reportes/export-exceptions - Excepciones de asistencia
router.get('/export-exceptions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id } = req.query;
    
    console.log('Export Exceptions - Parámetros recibidos:', { from, to, user_id });
    
    // Construir filtros
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (from) {
      whereClause += ` AND ae.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }
    if (to) {
      whereClause += ` AND ae.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }
    if (user_id) {
      whereClause += ` AND ae.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }

    console.log('Filtros construidos para attendance_exceptions:', { whereClause, values });

    // Obtener datos de excepciones
    const exceptionsData = await pool.query(`
      SELECT 
        ae.id,
        TO_CHAR(ae.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email as consultor_email,
        ae.status as tipo_excepcion,
        ae.reason as motivo,
        TO_CHAR(ae.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion,
        creator.name as creado_por
      FROM attendance_exceptions ae
      JOIN users u ON ae.user_id = u.id
      LEFT JOIN users creator ON ae.created_by = creator.id
      ${whereClause}
      ORDER BY ae.date DESC, u.name
    `, values);

    console.log('Datos de excepciones obtenidos:', exceptionsData.rows.length, 'registros');

    // Formatear datos para exportación
    const formattedData = exceptionsData.rows.map(row => ({
      id: row.id,
      date: row.fecha,
      consultorName: row.consultor,
      consultorEmail: row.consultor_email,
      exceptionType: row.tipo_excepcion,
      reason: row.motivo,
      createdAt: row.fecha_creacion,
      createdBy: row.creado_por
    }));

    res.json({
      data: formattedData,
      totalRecords: formattedData.length,
      exportDate: new Date().toISOString(),
      filters: {
        from,
        to,
        user_id
      }
    });
  } catch (error) {
    console.error('Error exportando datos de excepciones:', error);
    res.status(500).json({ message: 'Error exportando datos de excepciones' });
  }
});

// GET /api/reportes/export-consolidated - Reporte completo con múltiples hojas
router.get('/export-consolidated', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id, project_id, hour_type_id, status } = req.query;
    
    console.log('Export Consolidated - Parámetros recibidos:', { from, to, user_id, project_id, hour_type_id, status });
    
    // Construir filtros para work_hours
    let hoursWhereClause = 'WHERE 1=1';
    const hoursValues = [];
    let hoursParamIndex = 1;

    if (from) {
      hoursWhereClause += ` AND wh.date >= $${hoursParamIndex}`;
      hoursValues.push(from);
      hoursParamIndex++;
    }
    if (to) {
      hoursWhereClause += ` AND wh.date <= $${hoursParamIndex}`;
      hoursValues.push(to);
      hoursParamIndex++;
    }
    if (user_id) {
      hoursWhereClause += ` AND wh.user_id = $${hoursParamIndex}`;
      hoursValues.push(user_id);
      hoursParamIndex++;
    }
    if (project_id) {
      hoursWhereClause += ` AND wh.project_id = $${hoursParamIndex}`;
      hoursValues.push(project_id);
      hoursParamIndex++;
    }
    if (hour_type_id) {
      hoursWhereClause += ` AND wh.hour_type_id = $${hoursParamIndex}`;
      hoursValues.push(hour_type_id);
      hoursParamIndex++;
    }

    // Construir filtros para attendance_reports
    let attendanceWhereClause = 'WHERE u.role != \'administrador\'';
    const attendanceValues = [];
    let attendanceParamIndex = 1;

    if (from) {
      attendanceWhereClause += ` AND ar.date >= $${attendanceParamIndex}`;
      attendanceValues.push(from);
      attendanceParamIndex++;
    }
    if (to) {
      attendanceWhereClause += ` AND ar.date <= $${attendanceParamIndex}`;
      attendanceValues.push(to);
      attendanceParamIndex++;
    }
    if (user_id) {
      attendanceWhereClause += ` AND ar.user_id = $${attendanceParamIndex}`;
      attendanceValues.push(user_id);
      attendanceParamIndex++;
    }
    if (status) {
      attendanceWhereClause += ` AND ar.attendance_status = $${attendanceParamIndex}`;
      attendanceValues.push(status);
      attendanceParamIndex++;
    }

    // Construir filtros para attendance_exceptions
    let exceptionsWhereClause = 'WHERE 1=1';
    const exceptionsValues = [];
    let exceptionsParamIndex = 1;

    if (from) {
      exceptionsWhereClause += ` AND ae.date >= $${exceptionsParamIndex}`;
      exceptionsValues.push(from);
      exceptionsParamIndex++;
    }
    if (to) {
      exceptionsWhereClause += ` AND ae.date <= $${exceptionsParamIndex}`;
      exceptionsValues.push(to);
      exceptionsParamIndex++;
    }
    if (user_id) {
      exceptionsWhereClause += ` AND ae.user_id = $${exceptionsParamIndex}`;
      exceptionsValues.push(user_id);
      exceptionsParamIndex++;
    }

    console.log('Filtros construidos:', { 
      hoursWhereClause, 
      attendanceWhereClause, 
      exceptionsWhereClause 
    });

    // Obtener datos de horas
    const hoursData = await pool.query(`
      SELECT 
        wh.id as id_registro,
        TO_CHAR(wh.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email as consultor_email,
        pr.nombre as project_name,
        pr.cliente as client_name,
        pm.nombre as product_manager_name,
        tp.nombre as hour_type_name,
        cp.nombre as country_name,
        wh.hours_quantity as horas,
        wh.task_description as descripcion,
        TO_CHAR(wh.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      LEFT JOIN parametros pm ON pr.project_manager_id = pm.id AND pm.tipo = 'pm'
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN parametros cp ON wh.country_id = cp.id AND cp.tipo = 'pais'
      ${hoursWhereClause}
      ORDER BY wh.date DESC, u.name
    `, hoursValues);

    // Obtener datos de asistencia
    const attendanceData = await pool.query(`
      SELECT 
        ar.id,
        TO_CHAR(ar.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email as consultor_email,
        ar.attendance_status as estado_asistencia,
        ar.total_hours_worked as horas_trabajadas,
        TO_CHAR(ar.first_entry_time, 'HH24:MI:SS') as primera_entrada,
        TO_CHAR(ar.last_exit_time, 'HH24:MI:SS') as ultima_salida,
        ac.timezone as zona_horaria,
        TO_CHAR(ar.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN attendance_config ac ON ar.user_id = ac.user_id
      ${attendanceWhereClause}
      ORDER BY ar.date DESC, u.name
    `, attendanceValues);

    // Obtener datos de excepciones
    const exceptionsData = await pool.query(`
      SELECT 
        ae.id,
        TO_CHAR(ae.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email as consultor_email,
        ae.status as tipo_excepcion,
        ae.reason as motivo,
        TO_CHAR(ae.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion,
        creator.name as creado_por
      FROM attendance_exceptions ae
      JOIN users u ON ae.user_id = u.id
      LEFT JOIN users creator ON ae.created_by = creator.id
      ${exceptionsWhereClause}
      ORDER BY ae.date DESC, u.name
    `, exceptionsValues);

    console.log('Datos consolidados obtenidos:', {
      hours: hoursData.rows.length,
      attendance: attendanceData.rows.length,
      exceptions: exceptionsData.rows.length
    });

    // Formatear datos para exportación
    const hoursFormatted = hoursData.rows.map(row => ({
      id: row.id_registro,
      date: row.fecha,
      consultorName: row.consultor,
      consultorEmail: row.consultor_email,
      projectName: row.project_name,
      clientName: row.client_name,
      productManagerName: row.product_manager_name || '',
      hourTypeName: row.hour_type_name,
      countryName: row.country_name,
      hours: row.horas,
      description: row.descripcion,
      createdAt: row.fecha_creacion
    }));

    const attendanceFormatted = attendanceData.rows.map(row => ({
      id: row.id,
      date: row.fecha,
      consultorName: row.consultor,
      consultorEmail: row.consultor_email,
      attendanceStatus: row.estado_asistencia,
      hoursWorked: row.horas_trabajadas,
      firstEntry: row.primera_entrada,
      lastExit: row.ultima_salida,
      timezone: row.zona_horaria,
      createdAt: row.fecha_creacion
    }));

    const exceptionsFormatted = exceptionsData.rows.map(row => ({
      id: row.id,
      date: row.fecha,
      consultorName: row.consultor,
      consultorEmail: row.consultor_email,
      exceptionType: row.tipo_excepcion,
      reason: row.motivo,
      createdAt: row.fecha_creacion,
      createdBy: row.creado_por
    }));

    res.json({
      data: {
        hours: hoursFormatted,
        attendance: attendanceFormatted,
        exceptions: exceptionsFormatted
      },
      summary: {
        totalHours: hoursFormatted.length,
        totalAttendance: attendanceFormatted.length,
        totalExceptions: exceptionsFormatted.length
      },
      exportDate: new Date().toISOString(),
      filters: {
        from,
        to,
        user_id,
        project_id,
        hour_type_id,
        status
      }
    });
  } catch (error) {
    console.error('Error exportando datos consolidados:', error);
    res.status(500).json({ message: 'Error exportando datos consolidados' });
  }
});

// GET /api/reportes/export-unified - Exportación unificada
router.get('/export-unified', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { format = 'excel', from, to, user_id, project_id, hour_type_id } = req.query;
    
    // Construir filtros
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (from) {
      whereClause += ` AND wh.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }
    if (to) {
      whereClause += ` AND wh.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }
    if (user_id) {
      whereClause += ` AND wh.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }
    if (project_id) {
      whereClause += ` AND wh.project_id = $${paramIndex}`;
      values.push(project_id);
      paramIndex++;
    }
    if (hour_type_id) {
      whereClause += ` AND wh.hour_type_id = $${paramIndex}`;
      values.push(hour_type_id);
      paramIndex++;
    }

    // Obtener datos para exportación
    const exportData = await pool.query(`
      SELECT 
        wh.id as id_registro,
        TO_CHAR(wh.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        pr.nombre as project_name,
        pr.cliente as client_name,
        pm.nombre as product_manager_name,
        tp.nombre as hour_type_name,
        cp.nombre as country_name,
        wh.hours_quantity as horas,
        wh.task_description as descripcion,
        TO_CHAR(wh.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion,
        ar.attendance_status as estado_asistencia,
        ar.total_hours_worked as horas_asistencia,
        TO_CHAR(ar.first_entry_time, 'HH24:MI:SS') as primera_entrada,
        TO_CHAR(ar.last_exit_time, 'HH24:MI:SS') as ultima_salida
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      LEFT JOIN parametros pm ON pr.project_manager_id = pm.id AND pm.tipo = 'pm'
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN parametros cp ON wh.country_id = cp.id AND cp.tipo = 'pais'
      LEFT JOIN attendance_reports ar ON wh.user_id = ar.user_id AND wh.date = ar.date
      ${whereClause}
      ORDER BY wh.date DESC, u.name
    `, values);

    // Formatear datos según el formato solicitado
    const formattedData = exportData.rows.map(row => ({
      id: row.id_registro,
      date: row.fecha,
      consultorName: row.consultor,
      projectName: row.project_name,
      clientName: row.client_name,
      productManagerName: row.product_manager_name || '',
      hourTypeName: row.hour_type_name,
      countryName: row.country_name,
      hours: row.horas,
      description: row.descripcion,
      createdAt: row.fecha_creacion,
      attendanceStatus: row.estado_asistencia,
      attendanceHours: row.horas_asistencia,
      firstEntry: row.primera_entrada,
      lastExit: row.ultima_salida
    }));

    res.json({
      data: formattedData,
      format: format,
      totalRecords: formattedData.length,
      exportDate: new Date().toISOString(),
      filters: {
        from,
        to,
        user_id,
        project_id,
        hour_type_id
      }
    });
  } catch (error) {
    console.error('Error exportando datos unificados:', error);
    res.status(500).json({ message: 'Error exportando datos unificados' });
  }
});

module.exports = router;
