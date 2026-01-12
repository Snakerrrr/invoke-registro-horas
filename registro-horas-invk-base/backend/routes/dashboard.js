const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

// Horas registradas hoy
router.get('/summary/today', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Debug - Fecha de hoy:', today);
    console.log('Debug - User ID:', userId);
    console.log('Debug - Role:', role);

    // Primero, vamos a ver qué registros existen para hoy
    const debugQuery = role === 'consultor'
      ? `SELECT date, hours_quantity, user_id FROM work_hours WHERE date = $1 AND user_id = $2 ORDER BY created_at DESC`
      : `SELECT date, hours_quantity, user_id FROM work_hours WHERE date = $1 ORDER BY created_at DESC`;

    const debugParams = role === 'consultor' ? [today, userId] : [today];
    const debugResult = await pool.query(debugQuery, debugParams);
    
    console.log('Debug - Registros encontrados para hoy:', debugResult.rows);

    // Ahora la consulta principal
    const query = role === 'consultor'
      ? `SELECT COALESCE(SUM(hours_quantity), 0) AS total FROM work_hours WHERE date = $1 AND user_id = $2`
      : `SELECT COALESCE(SUM(hours_quantity), 0) AS total FROM work_hours WHERE date = $1`;

    const params = role === 'consultor' ? [today, userId] : [today];
    const result = await pool.query(query, params);

    console.log('Debug - Total calculado:', result.rows[0].total);

    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error('Error al obtener horas de hoy:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Horas registradas este mes
router.get('/summary/month', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    const query = role === 'consultor'
      ? `SELECT COALESCE(SUM(hours_quantity), 0) AS total FROM work_hours WHERE date >= date_trunc('month', CURRENT_DATE) AND date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' AND user_id = $1`
      : `SELECT COALESCE(SUM(hours_quantity), 0) AS total FROM work_hours WHERE date >= date_trunc('month', CURRENT_DATE) AND date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`;

    const params = role === 'consultor' ? [userId] : [];
    const result = await pool.query(query, params);

    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error('Error al obtener horas del mes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Proyectos activos
router.get('/summary/active-projects', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    const result = role === 'consultor'
      ? await pool.query(`
          SELECT COUNT(DISTINCT pr.id) AS count
          FROM work_hours wh
          JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
          WHERE wh.user_id = $1
        `, [userId])
      : await pool.query(`
          SELECT COUNT(*) AS count
          FROM parametros
          WHERE tipo = 'proyecto' AND activo = true
        `);

    res.json({ total: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error al obtener proyectos activos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Usuarios activos
router.get('/summary/active-users', authMiddleware, async (req, res) => {
  const { role } = req.user;
  try {
    if (role === 'consultor') return res.json({ total: 1 });

    const result = await pool.query(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM work_hours
      WHERE date >= date_trunc('month', CURRENT_DATE)
    `);

    res.json({ total: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error al obtener usuarios activos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actividad reciente
router.get('/recent-activity', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    const query = role === 'consultor'
      ? `
        SELECT 
          wh.date,
          pr.id AS project_id,                       
          pr.nombre AS project,
          pr.cliente AS client,
          u.name AS user,
          tp.nombre AS hour_type,
          wh.hours_quantity
        FROM work_hours wh
        JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
        JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
        JOIN users u ON wh.user_id = u.id
        WHERE wh.user_id = $1
        ORDER BY wh.created_at DESC
        LIMIT 5`
      : `
        SELECT 
          wh.date,
          pr.id AS project_id,                        
          pr.nombre AS project,
          pr.cliente AS client,
          u.name AS user,
          tp.nombre AS hour_type,
          wh.hours_quantity
        FROM work_hours wh
        JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
        JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
        JOIN users u ON wh.user_id = u.id
        ORDER BY wh.created_at DESC
        LIMIT 5`;

    const params = role === 'consultor' ? [userId] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener actividad reciente:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// Horas por proyecto
router.get('/hours-by-project', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    const query = role === 'consultor'
      ? `SELECT pr.id, pr.nombre AS project_name, pr.cliente AS cliente, SUM(wh.hours_quantity)::NUMERIC AS total_hours
         FROM work_hours wh
         JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
         WHERE wh.user_id = $1
         GROUP BY pr.id, pr.nombre, pr.cliente
         ORDER BY total_hours DESC`
      : `SELECT pr.id, pr.nombre AS project_name, pr.cliente AS cliente, SUM(wh.hours_quantity)::NUMERIC AS total_hours
         FROM work_hours wh
         JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
         GROUP BY pr.id, pr.nombre, pr.cliente
         ORDER BY total_hours DESC`;

    const params = role === 'consultor' ? [userId] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener horas por proyecto:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});





// Horas por tipo de hora
router.get('/hours-by-type', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  try {
    const query = role === 'consultor'
      ? `SELECT tp.nombre AS hour_type, SUM(wh.hours_quantity) AS total_hours
         FROM work_hours wh
         JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
         WHERE DATE_TRUNC('month', wh.date) = DATE_TRUNC('month', CURRENT_DATE)
           AND wh.user_id = $1
         GROUP BY tp.nombre`
      : `SELECT tp.nombre AS hour_type, SUM(wh.hours_quantity) AS total_hours
         FROM work_hours wh
         JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
         WHERE DATE_TRUNC('month', wh.date) = DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY tp.nombre`;

    const params = role === 'consultor' ? [userId] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener horas por tipo:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Horas por mes y proyecto
router.get('/hours-per-month', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  let { project } = req.query;

  try {
    let query = `
      SELECT TO_CHAR(DATE_TRUNC('month', wh.date), 'YYYY-MM') AS month,
             CONCAT(pr.nombre, ' - ', pr.cliente) AS project,
             pr.id AS project_id,
             SUM(wh.hours_quantity) AS total_hours
      FROM work_hours wh
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      WHERE 1 = 1
    `;

    const params = [];
    let index = 1;

    if (role === 'consultor') {
      query += ` AND wh.user_id = $${index++}`;
      params.push(userId);
    }

    if (project) {
      if (!Array.isArray(project)) project = [project];
      const placeholders = project.map((_, i) => `$${index + i}`).join(', ');
      query += ` AND pr.id IN (${placeholders})`;
      params.push(...project.map(Number));
      index += project.length;
    }

    query += ` GROUP BY DATE_TRUNC('month', wh.date), pr.nombre, pr.cliente, pr.id ORDER BY DATE_TRUNC('month', wh.date)`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener horas por mes:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});



// Distribución por tipo de hora
router.get('/hours-type-distribution', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  const { period = '1m' } = req.query;

  const periodMap = {
    '1m': "CURRENT_DATE - INTERVAL '1 month'",
    '3m': "CURRENT_DATE - INTERVAL '3 months'",
    '6m': "CURRENT_DATE - INTERVAL '6 months'",
    '1y': "CURRENT_DATE - INTERVAL '1 year'"
  };

  const since = periodMap[period] || periodMap['1m'];

  try {
    const query = role === 'consultor'
      ? `SELECT tp.nombre AS hour_type, SUM(wh.hours_quantity) AS total_hours
         FROM work_hours wh
         JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
         WHERE wh.date >= ${since} AND wh.user_id = $1
         GROUP BY tp.nombre`
      : `SELECT tp.nombre AS hour_type, SUM(wh.hours_quantity) AS total_hours
         FROM work_hours wh
         JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
         WHERE wh.date >= ${since}
         GROUP BY tp.nombre`;

    const params = role === 'consultor' ? [userId] : [];
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener distribución por tipo de hora:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


module.exports = router;
