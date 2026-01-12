const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

// Utils
function calculateBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end < start) return 0;
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay(); // 0 dom, 6 sab
    if (day !== 0 && day !== 6) days += 1;
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Crear solicitud de vacaciones (consultor)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, reason } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date y end_date son requeridos' });
    }

    // Obtener políticas
    const policies = await getPolicies();
    
    // Validaciones basadas en políticas
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    
    // Validar días mínimos de anticipación
    const minAdvanceDays = parseInt(policies.min_advance_days || '7');
    const daysDiff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff < minAdvanceDays) {
      return res.status(400).json({ 
        message: `Debes solicitar con al menos ${minAdvanceDays} días de anticipación` 
      });
    }
    
    // Validar días máximos consecutivos
    const maxConsecutiveDays = parseInt(policies.max_consecutive_days || '30');
    const totalDays = calculateBusinessDays(start_date, end_date);
    if (totalDays === null || totalDays <= 0) {
      return res.status(400).json({ message: 'Rango de fechas inválido' });
    }
    if (totalDays > maxConsecutiveDays) {
      return res.status(400).json({ 
        message: `No puedes solicitar más de ${maxConsecutiveDays} días consecutivos` 
      });
    }
    
    // Validar máximo solicitudes por año
    const maxRequestsPerYear = parseInt(policies.max_requests_per_year || '5');
    const currentYear = new Date().getFullYear();
    const { rows: existingRequests } = await pool.query(
      'SELECT COUNT(*) as count FROM vacation_requests WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
      [userId, currentYear]
    );
    if (parseInt(existingRequests[0].count) >= maxRequestsPerYear) {
      return res.status(400).json({ 
        message: `Ya has alcanzado el máximo de ${maxRequestsPerYear} solicitudes por año` 
      });
    }

    // Validar balance disponible (opcional - solo si hay balance configurado)
    const { rows: balanceRows } = await pool.query(
      'SELECT * FROM vacation_balances WHERE user_id = $1 AND year = $2',
      [userId, currentYear]
    );
    
    if (balanceRows.length > 0) {
      const balance = balanceRows[0];
      const { rows: usedRows } = await pool.query(
        'SELECT COALESCE(SUM(total_days), 0) AS used_days FROM vacation_requests WHERE user_id = $1 AND status = $2 AND EXTRACT(YEAR FROM start_date) = $3',
        [userId, 'aprobada', currentYear]
      );
      const usedDays = Number(usedRows[0]?.used_days || 0);
      const available = Number(balance.days_allocated) + Number(balance.days_carried) - usedDays;
      
      if (totalDays > available) {
        return res.status(400).json({ 
          message: `No tienes suficientes días disponibles. Tienes ${available} días y solicitas ${totalDays} días` 
        });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO vacation_requests (user_id, start_date, end_date, total_days, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, start_date, end_date, totalDays, reason || null]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear solicitud de vacaciones:', err);
    return res.status(500).json({ message: 'Error al crear solicitud de vacaciones' });
  }
});

// Listar mis solicitudes
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT vr.*, u.name AS user_name
       FROM vacation_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.user_id = $1
       ORDER BY vr.created_at DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error al listar mis solicitudes:', err);
    return res.status(500).json({ message: 'Error al listar solicitudes' });
  }
});

// Listar todas (admin) con filtros opcionales
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, user_id, from, to } = req.query;
    let sql = `
      SELECT 
        vr.id,
        vr.user_id,
        vr.start_date,
        vr.end_date,
        vr.total_days,
        vr.status,
        vr.reason,
        vr.approver_id,
        vr.decision_at,
        vr.admin_comment,
        vr.created_at,
        vr.updated_at,
        u.name AS user_name,
        ua.name AS approver_name
      FROM vacation_requests vr
      JOIN users u ON u.id = vr.user_id
      LEFT JOIN users ua ON ua.id = vr.approver_id
      WHERE 1=1`;
    const params = [];
    if (status) {
      params.push(status);
      sql += ` AND vr.status = $${params.length}`;
    }
    if (user_id) {
      params.push(Number(user_id));
      sql += ` AND vr.user_id = $${params.length}`;
    }
    if (from) {
      params.push(from);
      sql += ` AND vr.start_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      sql += ` AND vr.end_date <= $${params.length}`;
    }
    sql += ' ORDER BY vr.created_at DESC';
    const { rows } = await pool.query(sql, params);
    
    // Formatear los datos para el frontend
    const formattedRows = rows.map(row => ({
      ...row,
      total_days: Number(row.total_days).toFixed(2),
      status: row.status || 'pendiente',
      start_date: row.start_date,
      end_date: row.end_date,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    return res.json(formattedRows);
  } catch (err) {
    console.error('Error al listar solicitudes (admin):', err);
    return res.status(500).json({ message: 'Error al listar solicitudes' });
  }
});


// GET /api/vacations/detail/:id - Obtener detalle completo de solicitud (para modal)
router.get('/detail/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    
    const { rows } = await pool.query(
      `SELECT 
        vr.*,
        u.name AS user_name,
        u.email AS user_email,
        ua.name AS approver_name,
        ua.email AS approver_email
       FROM vacation_requests vr
       JOIN users u ON u.id = vr.user_id
       LEFT JOIN users ua ON ua.id = vr.approver_id
       WHERE vr.id = $1`,
      [id]
    );
    
    const item = rows[0];
    if (!item) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (role !== 'administrador' && item.user_id !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    return res.json(item);
  } catch (err) {
    console.error('Error al obtener detalle de solicitud:', err);
    return res.status(500).json({ message: 'Error al obtener detalle de solicitud' });
  }
});

// Cancelar mi solicitud mientras esté pendiente
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rows } = await pool.query(
      `UPDATE vacation_requests
       SET status = 'cancelada'
       WHERE id = $1 AND user_id = $2 AND status = 'pendiente'
       RETURNING *`,
      [id, userId]
    );
    if (!rows[0]) return res.status(400).json({ message: 'No se puede cancelar esta solicitud' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error al cancelar solicitud:', err);
    return res.status(500).json({ message: 'Error al cancelar solicitud' });
  }
});

// Aprobar/Rechazar (admin)
router.put('/:id/decision', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user.id;
    const { status, admin_comment } = req.body; // 'aprobada' | 'rechazada'
    
    console.log('Procesando decisión:', { id, status, admin_comment, approverId });
    
    // Validar que el status sea válido
    if (!['aprobada', 'rechazada'].includes(status)) {
      console.log('Status inválido:', status);
      return res.status(400).json({ message: 'Decision inválida' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE vacation_requests
         SET status = $1, approver_id = $2, decision_at = NOW(), admin_comment = $3
         WHERE id = $4 AND status = 'pendiente'
         RETURNING *`,
        [status, approverId, admin_comment || null, id]
      );
      const updated = rows[0];
      if (!updated) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'No se pudo aplicar la decisión' });
      }

      // Si aprobada, opcionalmente descontar del balance del año de inicio
      if (status === 'aprobada') {
        const year = new Date(updated.start_date).getFullYear();
        await client.query(
          `INSERT INTO vacation_balances (user_id, year, days_allocated, days_carried)
           VALUES ($1, $2, 0, 0)
           ON CONFLICT (user_id, year) DO NOTHING`,
          [updated.user_id, year]
        );
        await client.query(
          `UPDATE vacation_balances
           SET days_allocated = GREATEST(days_allocated - $1, 0), updated_at = NOW()
           WHERE user_id = $2 AND year = $3`,
          [updated.total_days, updated.user_id, year]
        );
      }

      await client.query('COMMIT');
      return res.json(updated);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al decidir solicitud:', err);
    return res.status(500).json({ message: 'Error al decidir solicitud' });
  }
});


// Gestión de Políticas
// Función para obtener políticas
async function getPolicies() {
  try {
    const { rows } = await pool.query('SELECT policy_key, policy_value FROM vacation_policies');
    const policies = {};
    rows.forEach(row => {
      policies[row.policy_key] = row.policy_value;
    });
    return policies;
  } catch (err) {
    console.error('Error al obtener políticas:', err);
    // Si la tabla no existe, retornar políticas por defecto
    return {
      min_advance_days: '7',
      max_consecutive_days: '30',
      max_requests_per_year: '5',
      default_days_per_year: '20',
      max_carry_over_days: '10',
      auto_approve_days: '3',
      notify_on_request: 'true',
      notify_on_decision: 'true',
      auto_reminder_days: '30'
    };
  }
}

// GET /api/vacations/policies - Obtener todas las políticas
router.get('/policies', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT policy_key, policy_value, description FROM vacation_policies ORDER BY policy_key'
    );
    
    // Convertir a objeto para fácil uso en frontend
    const policies = {};
    rows.forEach(row => {
      policies[row.policy_key] = {
        value: row.policy_value,
        description: row.description
      };
    });
    
    // Si no hay políticas en la BD, usar valores por defecto
    if (Object.keys(policies).length === 0) {
      policies.min_advance_days = { value: '7', description: 'Días mínimos de anticipación' };
      policies.max_consecutive_days = { value: '30', description: 'Días máximos consecutivos' };
      policies.max_requests_per_year = { value: '5', description: 'Máximo solicitudes por año' };
      policies.default_days_per_year = { value: '20', description: 'Días por defecto por año' };
      policies.max_carry_over_days = { value: '10', description: 'Máximo días a arrastrar' };
      policies.auto_approve_days = { value: '3', description: 'Días de aprobación automática' };
      policies.notify_on_request = { value: 'true', description: 'Notificar al admin' };
      policies.notify_on_decision = { value: 'true', description: 'Notificar al usuario' };
      policies.auto_reminder_days = { value: '30', description: 'Días para recordatorio' };
    }
    
    res.json(policies);
  } catch (err) {
    console.error('Error al obtener políticas:', err);
    
    // En caso de error, retornar políticas por defecto
    const defaultPolicies = {
      min_advance_days: { value: '7', description: 'Días mínimos de anticipación' },
      max_consecutive_days: { value: '30', description: 'Días máximos consecutivos' },
      max_requests_per_year: { value: '5', description: 'Máximo solicitudes por año' },
      default_days_per_year: { value: '20', description: 'Días por defecto por año' },
      max_carry_over_days: { value: '10', description: 'Máximo días a arrastrar' },
      auto_approve_days: { value: '3', description: 'Días de aprobación automática' },
      notify_on_request: { value: 'true', description: 'Notificar al admin' },
      notify_on_decision: { value: 'true', description: 'Notificar al usuario' },
      auto_reminder_days: { value: '30', description: 'Días para recordatorio' }
    };
    
    res.json(defaultPolicies);
  }
});

// PUT /api/vacations/policies - Actualizar políticas
router.put('/policies', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const policies = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const [key, value] of Object.entries(policies)) {
        await client.query(
          'UPDATE vacation_policies SET policy_value = $1, updated_at = NOW() WHERE policy_key = $2',
          [value.toString(), key]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Políticas actualizadas correctamente' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al actualizar políticas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/vacations/policies/public - Obtener políticas públicas (sin autenticación)
router.get('/policies/public', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT policy_key, policy_value 
      FROM vacation_policies 
      WHERE policy_key IN ('min_advance_days', 'max_consecutive_days', 'max_requests_per_year', 'default_days_per_year')
      ORDER BY policy_key
    `);
    
    const policies = {};
    rows.forEach(row => {
      policies[row.policy_key] = row.policy_value;
    });
    
    res.json(policies);
  } catch (err) {
    console.error('Error al obtener políticas públicas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/vacations/stats - Obtener estadísticas para el dashboard (admin)
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN status = 'aprobada' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN status = 'rechazada' THEN 1 END) as rechazadas,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas
      FROM vacation_requests
    `);
    
    const stats = rows[0];
    res.json({
      total: parseInt(stats.total),
      pendientes: parseInt(stats.pendientes),
      aprobadas: parseInt(stats.aprobadas),
      rechazadas: parseInt(stats.rechazadas),
      canceladas: parseInt(stats.canceladas)
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// Balance de vacaciones
// Obtener mi balance por año
router.get('/balance/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = Number(req.query.year) || new Date().getFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    const { rows: balanceRows } = await pool.query(
      `SELECT * FROM vacation_balances WHERE user_id = $1 AND year = $2`,
      [userId, year]
    );

    const { rows: usedRows } = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS used_days
       FROM vacation_requests
       WHERE user_id = $1 AND status = 'aprobada'
         AND start_date >= $2 AND end_date <= $3`,
      [userId, yearStart.toISOString().slice(0,10), yearEnd.toISOString().slice(0,10)]
    );

    const balance = balanceRows[0] || { user_id: userId, year, days_allocated: 0, days_carried: 0 };
    const usedDays = Number(usedRows[0]?.used_days || 0);
    const available = Math.max(Number(balance.days_allocated) + Number(balance.days_carried) - usedDays, 0);
    return res.json({ ...balance, used_days: usedDays, available_days: available });
  } catch (err) {
    console.error('Error al obtener balance propio:', err);
    return res.status(500).json({ message: 'Error al obtener balance' });
  }
});

// Obtener balance de un usuario (admin)
router.get('/balance/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const year = Number(req.query.year) || new Date().getFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    const { rows: balanceRows } = await pool.query(
      `SELECT * FROM vacation_balances WHERE user_id = $1 AND year = $2`,
      [userId, year]
    );
    const { rows: usedRows } = await pool.query(
      `SELECT COALESCE(SUM(total_days), 0) AS used_days
       FROM vacation_requests
       WHERE user_id = $1 AND status = 'aprobada'
         AND start_date >= $2 AND end_date <= $3`,
      [userId, yearStart.toISOString().slice(0,10), yearEnd.toISOString().slice(0,10)]
    );
    const balance = balanceRows[0] || { user_id: userId, year, days_allocated: 0, days_carried: 0 };
    const usedDays = Number(usedRows[0]?.used_days || 0);
    const available = Math.max(Number(balance.days_allocated) + Number(balance.days_carried) - usedDays, 0);
    return res.json({ ...balance, used_days: usedDays, available_days: available });
  } catch (err) {
    console.error('Error al obtener balance (admin):', err);
    return res.status(500).json({ message: 'Error al obtener balance' });
  }
});

// Actualizar balance de un usuario (admin) upsert
router.put('/balance/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { year, days_allocated, days_carried } = req.body;
    const theYear = Number(year) || new Date().getFullYear();
    const allocated = Number(days_allocated ?? 0);
    const carried = Number(days_carried ?? 0);

    const { rows } = await pool.query(
      `INSERT INTO vacation_balances (user_id, year, days_allocated, days_carried)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, year)
       DO UPDATE SET days_allocated = EXCLUDED.days_allocated,
                     days_carried = EXCLUDED.days_carried,
                     updated_at = NOW()
       RETURNING *`,
      [userId, theYear, allocated, carried]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar balance (admin):', err);
    return res.status(500).json({ message: 'Error al actualizar balance' });
  }
});

// Obtener una solicitud (propia o admin) 
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    const { rows } = await pool.query(
      `SELECT vr.*, u.name AS user_name, ua.name AS approver_name
       FROM vacation_requests vr
       JOIN users u ON u.id = vr.user_id
       LEFT JOIN users ua ON ua.id = vr.approver_id
       WHERE vr.id = $1`,
      [id]
    );
    const item = rows[0];
    if (!item) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (role !== 'administrador' && item.user_id !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    return res.json(item);
  } catch (err) {
    console.error('Error al obtener solicitud:', err);
    return res.status(500).json({ message: 'Error al obtener solicitud' });
  }
});

module.exports = router;



