const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

// GET /api/attendance/today - Obtener estado de asistencia del día actual (remoto)
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Obtener reporte de asistencia del día
    const attendanceResult = await pool.query(`
      SELECT 
        ar.*,
        u.name as user_name,
        ac.preferred_start_time,
        ac.preferred_end_time,
        ac.min_hours_full_day,
        ac.min_hours_half_day,
        ac.flexible_hours,
        ac.timezone
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN attendance_config ac ON ar.user_id = ac.user_id
      WHERE ar.user_id = $1 AND ar.date = $2
    `, [userId, today]);

    // Obtener total de horas registradas hoy
    const hoursResult = await pool.query(`
      SELECT COALESCE(SUM(hours_quantity), 0) as total_hours
      FROM work_hours 
      WHERE user_id = $1 AND date = $2
    `, [userId, today]);

    // Verificar si hay excepción para hoy
    const exceptionResult = await pool.query(`
      SELECT status, reason
      FROM attendance_exceptions 
      WHERE user_id = $1 AND date = $2
    `, [userId, today]);

    const attendance = attendanceResult.rows[0];
    const totalHours = Number(hoursResult.rows[0]?.total_hours || 0);
    const exception = exceptionResult.rows[0];

    res.json({
      date: today,
      user_id: userId,
      user_name: req.user.name,
      attendance_status: exception ? exception.status : (attendance?.attendance_status || 'ausente'),
      total_hours_worked: totalHours,
      first_entry_time: attendance?.first_entry_time,
      last_exit_time: attendance?.last_exit_time,
      exception_reason: exception?.reason,
      config: {
        preferred_start_time: attendance?.preferred_start_time || '09:00:00',
        preferred_end_time: attendance?.preferred_end_time || '18:00:00',
        min_hours_full_day: Number(attendance?.min_hours_full_day || 8.0),
        min_hours_half_day: Number(attendance?.min_hours_half_day || 4.0),
        flexible_hours: attendance?.flexible_hours !== false,
        timezone: attendance?.timezone || 'UTC'
      }
    });
  } catch (err) {
    console.error('Error al obtener asistencia del día:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/attendance/exception - Registrar excepción (vacaciones, licencia, etc.)
router.post('/exception', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id; // ID del admin que crea la excepción
    const { user_id, date, status, reason } = req.body; // user_id del consultor

    if (!user_id || !date || !status) {
      return res.status(400).json({ message: 'Usuario, fecha y estado son requeridos' });
    }

    // Validar estado
    const validStatuses = ['vacaciones', 'licencia_medica', 'capacitacion', 'feriado', 'ausente'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const result = await pool.query(`
      INSERT INTO attendance_exceptions (user_id, date, status, reason, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, date, status, reason, adminId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al registrar excepción:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/attendance/exception/:date - Eliminar excepción
router.delete('/exception/:date', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { date } = req.params;
    const { user_id } = req.body; // Obtener user_id del body

    if (!user_id) {
      return res.status(400).json({ message: 'ID del usuario es requerido' });
    }

    const result = await pool.query(`
      DELETE FROM attendance_exceptions 
      WHERE user_id = $1 AND date = $2 AND created_by = $3
      RETURNING *
    `, [user_id, date, adminId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Excepción no encontrada' });
    }

    res.json({ message: 'Excepción eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar excepción:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/config - Obtener configuración del usuario
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        preferred_start_time,
        preferred_end_time,
        min_hours_full_day,
        min_hours_half_day,
        flexible_hours,
        auto_attendance,
        timezone
      FROM attendance_config 
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Retornar configuración por defecto
      return res.json({
        preferred_start_time: '09:00:00',
        preferred_end_time: '18:00:00',
        min_hours_full_day: 8.0,
        min_hours_half_day: 4.0,
        flexible_hours: true,
        auto_attendance: true,
        timezone: 'UTC'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener configuración:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/attendance/config - Actualizar configuración del usuario
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      preferred_start_time, 
      preferred_end_time, 
      min_hours_full_day, 
      min_hours_half_day, 
      flexible_hours, 
      timezone 
    } = req.body;

    // Validaciones
    if (min_hours_full_day < 0 || min_hours_half_day < 0) {
      return res.status(400).json({ message: 'Las horas deben ser positivas' });
    }

    if (min_hours_half_day >= min_hours_full_day) {
      return res.status(400).json({ message: 'Las horas de medio día deben ser menores a las de día completo' });
    }

    const result = await pool.query(`
      INSERT INTO attendance_config (
        user_id, preferred_start_time, preferred_end_time, 
        min_hours_full_day, min_hours_half_day, flexible_hours, timezone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        preferred_start_time = EXCLUDED.preferred_start_time,
        preferred_end_time = EXCLUDED.preferred_end_time,
        min_hours_full_day = EXCLUDED.min_hours_full_day,
        min_hours_half_day = EXCLUDED.min_hours_half_day,
        flexible_hours = EXCLUDED.flexible_hours,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
      RETURNING *
    `, [
      userId, 
      preferred_start_time || '09:00:00', 
      preferred_end_time || '18:00:00',
      min_hours_full_day || 8.0,
      min_hours_half_day || 4.0,
      flexible_hours !== false,
      timezone || 'UTC'
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar configuración:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/stats - Estadísticas de asistencia del usuario (remoto)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    // Usar la función específica para remoto
    const result = await pool.query(`
      SELECT * FROM get_attendance_stats_by_timezone($1, $2, $3)
    `, [userId, targetMonth, targetYear]);

    const stats = result.rows[0];

    res.json({
      month: targetMonth,
      year: targetYear,
      total_days: stats.total_days,
      present_days: stats.present_days,
      late_days: stats.late_days,
      absent_days: stats.absent_days,
      half_days: stats.half_days,
      total_hours: Number(stats.total_hours || 0),
      attendance_rate: Number(stats.attendance_rate || 0)
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/stats/global - Estadísticas globales del día actual (para tarjetas)
router.get('/stats/global', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Obtener estadísticas globales del día - EXCLUYENDO ADMINISTRADORES
    const statsResult = await pool.query(`
      SELECT 
        -- Total de usuarios (desde la tabla users, excluyendo administradores)
        (SELECT COUNT(*) FROM users WHERE role != 'administrador') as total_usuarios,
        
        -- Usuarios presentes (desde attendance_reports, excluyendo administradores)
        COUNT(CASE WHEN ar.attendance_status = 'presente' THEN 1 END) as usuarios_presentes,
        
        -- Usuarios ausentes (desde attendance_reports, excluyendo administradores)
        COUNT(CASE WHEN ar.attendance_status = 'ausente' THEN 1 END) as usuarios_ausentes,
        
        -- Tardanzas (desde attendance_reports, excluyendo administradores)
        COUNT(CASE WHEN ar.attendance_status = 'tardanza' THEN 1 END) as tardanzas,
        
        -- Medio día (desde attendance_reports, excluyendo administradores)
        COUNT(CASE WHEN ar.attendance_status = 'medio_dia' THEN 1 END) as medio_dia,
        
        -- Tasa de asistencia (presentes / total usuarios, excluyendo administradores)
        ROUND(
          (COUNT(CASE WHEN ar.attendance_status = 'presente' THEN 1 END) * 100.0 / 
           NULLIF((SELECT COUNT(*) FROM users WHERE role != 'administrador'), 0)), 1
        ) as tasa_asistencia
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.date = $1 AND u.role != 'administrador'
    `, [today]);

    const stats = statsResult.rows[0];

    // Obtener el total real de usuarios (excluyendo administradores)
    const totalUsersResult = await pool.query(`SELECT COUNT(*) as total FROM users WHERE role != 'administrador'`);
    const totalUsers = Number(totalUsersResult.rows[0].total);

    res.json({
      date: today,
      total_usuarios: totalUsers,
      usuarios_presentes: Number(stats.usuarios_presentes || 0),
      usuarios_ausentes: Number(stats.usuarios_ausentes || 0),
      tardanzas: Number(stats.tardanzas || 0),
      medio_dia: Number(stats.medio_dia || 0),
      tasa_asistencia: Number(stats.tasa_asistencia || 0)
    });
  } catch (err) {
    console.error('Error al obtener estadísticas globales:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/report - Reporte general de asistencia (admin)
router.get('/report', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id, status } = req.query;

    let query = `
      SELECT 
        ar.date,
        ar.user_id,
        u.name as user_name,
        u.email,
        ar.attendance_status,
        ar.total_hours_worked,
        ar.first_entry_time,
        ar.last_exit_time,
        ac.timezone,
        -- Obtener el motivo desde work_hours si es vacaciones
        CASE 
          WHEN ar.attendance_status = 'presente' AND EXISTS (
            SELECT 1 FROM work_hours wh 
            JOIN parametros p ON wh.hour_type_id = p.id 
            WHERE wh.user_id = ar.user_id 
            AND wh.date = ar.date 
            AND LOWER(p.nombre) LIKE '%vacacion%'
          ) THEN 'Vacaciones'
          WHEN ar.attendance_status = 'presente' THEN 'Horas registradas'
          ELSE '-'
        END as motivo
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN attendance_config ac ON ar.user_id = ac.user_id
      WHERE u.role != 'administrador'
    `;

    const values = [];
    let paramIndex = 1;

    if (from) {
      query += ` AND ar.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND ar.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND ar.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND ar.attendance_status = $${paramIndex}`;
      values.push(status);
    }

    query += ` ORDER BY ar.date DESC, u.name`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener reporte general:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/exceptions - Obtener excepciones del usuario
router.get('/exceptions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    let query = `
      SELECT 
        ae.date,
        ae.status,
        ae.reason,
        ae.created_at,
        ae.user_id,
        u.name as user_name,
        u.email as user_email
      FROM attendance_exceptions ae
      JOIN users u ON ae.user_id = u.id
      WHERE ae.user_id = $1
    `;

    const values = [userId];
    let paramIndex = 2;

    if (from) {
      query += ` AND ae.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND ae.date <= $${paramIndex}`;
      values.push(to);
    }

    query += ` ORDER BY ae.date DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener excepciones:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/exceptions/all - Obtener todas las excepciones (admin)
router.get('/exceptions/all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id } = req.query;

    let query = `
      SELECT 
        ae.date,
        ae.status,
        ae.reason,
        ae.created_at,
        ae.user_id,
        u.name as user_name,
        u.email as user_email
      FROM attendance_exceptions ae
      JOIN users u ON ae.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (from) {
      query += ` AND ae.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND ae.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND ae.user_id = $${paramIndex}`;
      values.push(user_id);
    }

    query += ` ORDER BY ae.date DESC, u.name`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener todas las excepciones:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// POST /api/attendance/generate-reports - Generar reportes de ausencia (admin)
router.post('/generate-reports', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Ejecutar la función que genera reportes de ausencia
    await pool.query('SELECT generate_absence_reports()');
    
     // Obtener los reportes generados para hoy (excluyendo administradores)
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(`
      SELECT 
        ar.date,
        u.name,
        ar.attendance_status,
        ar.total_hours_worked
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.date = $1 AND u.role != 'administrador'
      ORDER BY u.name
    `, [today]);

    res.json({
      message: 'Reportes de ausencia generados correctamente',
      date: today,
      reports: result.rows
    });
  } catch (err) {
    console.error('Error al generar reportes de ausencia:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/attendance/export - Exportar reporte de asistencia (admin)
router.get('/export', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { from, to, user_id } = req.query;

    let query = `
      SELECT 
        TO_CHAR(ar.date, 'YYYY-MM-DD') as fecha,
        u.name as consultor,
        u.email,
        ar.attendance_status as estado_asistencia,
        ar.total_hours_worked as horas_trabajadas,
        TO_CHAR(ar.first_entry_time, 'HH24:MI:SS') as primera_entrada,
        TO_CHAR(ar.last_exit_time, 'HH24:MI:SS') as ultima_salida,
        ac.timezone as zona_horaria
      FROM attendance_reports ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN attendance_config ac ON ar.user_id = ac.user_id
      WHERE u.role != 'administrador'
    `;

    const values = [];
    let paramIndex = 1;

    if (from) {
      query += ` AND ar.date >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND ar.date <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND ar.user_id = $${paramIndex}`;
      values.push(user_id);
    }

    query += ` ORDER BY ar.date DESC, u.name`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al exportar reporte:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
