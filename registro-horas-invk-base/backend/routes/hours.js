const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/hours/export
router.get('/export', authMiddleware, async (req, res) => {
  const { project_id, hour_type_id, from, to, user_id } = req.query;

  try {
    let query = `
      SELECT
        wh.id AS id_registro,
        TO_CHAR(wh.date, 'YYYY-MM-DD') AS fecha,
        u.name AS consultor,
        pr.nombre AS project_name,
        pr.cliente AS client_name,
        pm.nombre AS product_manager_name,
        tp.nombre AS hour_type_name,
        cp.nombre AS country_name,
        wh.hours_quantity AS horas,
        wh.task_description AS descripcion,
        TO_CHAR(wh.created_at, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      LEFT JOIN parametros pm ON pr.project_manager_id = pm.id AND pm.tipo = 'pm'
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN parametros cp ON wh.country_id = cp.id AND cp.tipo = 'pais'
      WHERE 1=1
    `;

    const values = [];

    if (project_id) {
      query += ` AND wh.project_id = $${values.length + 1}`;
      values.push(Number(project_id));
    }

    if (hour_type_id) {
      query += ` AND wh.hour_type_id = $${values.length + 1}`;
      values.push(Number(hour_type_id));
    }

    if (user_id) {
      query += ` AND wh.user_id = $${values.length + 1}`;
      values.push(Number(user_id));
    }

    if (from) {
      query += ` AND wh.date >= $${values.length + 1}`;
      values.push(from);
    }

    if (to) {
      query += ` AND wh.date <= $${values.length + 1}`;
      values.push(to);
    }

    query += ` ORDER BY wh.date DESC`;

    const result = await pool.query(query, values);

    const formatted = result.rows.map(row => ({
      id: row.id_registro,
      date: row.fecha,
      consultorName: row.consultor,
      projectName: row.project_name,
      clientName: row.client_name,
      productManagerName: row.product_manager_name,
      hourTypeName: row.hour_type_name,
      countryName: row.country_name,
      hours: row.horas,
      description: row.descripcion,
      createdAt: row.fecha_creacion,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error al exportar registros:', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/hours/today?tzOffset=-180
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // tzOffset en minutos (como lo entrega JS). Si no llega, asume 0 (UTC).
    const tzOffsetMin = Number(req.query.tzOffset ?? 0);

    // Calcula el inicio y fin del "hoy" local del cliente y pásalo a UTC
    const now = new Date();
    // construye "hoy 00:00" en zona local del cliente
    const localStart = new Date(now);
    localStart.setHours(0, 0, 0, 0);

    // Aplica el offset: para llevarlo a UTC, resta el offset en minutos
    const startUtc = new Date(localStart.getTime() - tzOffsetMin * 60 * 1000);
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

    const sql = `
      SELECT COALESCE(SUM(wh.hours_quantity), 0) AS total_hours
      FROM work_hours wh
      WHERE wh.user_id = $1
        AND wh.date >= $2
        AND wh.date <  $3
    `;

    const params = [userId, startUtc.toISOString(), endUtc.toISOString()];
    const { rows } = await pool.query(sql, params);

    const totalHours = Number(rows[0]?.total_hours || 0);
    const dailyGoal = Number(process.env.DAILY_GOAL_HOURS || 8);

    return res.json({ totalHours, dailyGoal });
  } catch (err) {
    console.error('Error /api/hours/today:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});



// GET /api/hours/recent - Obtener el último registro de horas del usuario logueado
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        wh.date, 
        COALESCE(pr.nombre, 'Sin proyecto asignado') AS proyecto,
        pr.cliente,
        cp.nombre AS pais,
        pr.id AS project_id,
        wh.hours_quantity AS hours, 
        wh.task_description AS description,
        wh.created_at
      FROM work_hours wh
      LEFT JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      LEFT JOIN parametros cp ON pr.relacionado_id = cp.id AND cp.tipo = 'pais'
      WHERE wh.user_id = $1
      ORDER BY wh.date DESC, wh.created_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No hay registros encontrados' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el último registro de horas:', error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/hours
router.get('/', authMiddleware, async (req, res) => {
  const { id: userId, role } = req.user;
  const { project_id, hour_type_id, from, to, user, user_id } = req.query;

  try {
    let query = `
      SELECT h.id, h.date, h.hours_quantity, h.task_description,
             cp.id AS country_id, cp.nombre AS country_name,
             pr.id AS project_id, pr.nombre AS project_name, pr.cliente,
             tp.id AS hour_type_id, tp.nombre AS hour_type_name,
             u.id AS user_id,
             u.name AS user_name,
             u.email
      FROM work_hours h
      JOIN parametros cp ON h.country_id = cp.id AND cp.tipo = 'pais'
      JOIN parametros pr ON h.project_id = pr.id AND pr.tipo = 'proyecto'
      JOIN parametros tp ON h.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN users u ON h.user_id = u.id
      WHERE 1=1
    `;

    const values = [];

    if (role === 'consultor') {
      query += ` AND h.user_id = $${values.length + 1}`;
      values.push(userId);
    }

    if (project_id) {
      query += ` AND h.project_id = $${values.length + 1}`;
      values.push(Number(project_id));
    }

    if (hour_type_id) {
      query += ` AND h.hour_type_id = $${values.length + 1}`;
      values.push(Number(hour_type_id));
    }

    if (from) {
      query += ` AND h.date >= $${values.length + 1}`;
      values.push(from);
    }

    if (to) {
      query += ` AND h.date <= $${values.length + 1}`;
      values.push(to);
    }

    if (user_id) {
      query += ` AND h.user_id = $${values.length + 1}`;
      values.push(Number(user_id));
    } else if (user) {
      query += ` AND LOWER(u.name) LIKE LOWER($${values.length + 1})`;
      values.push(`%${user.trim()}%`);
    }

    query += ` ORDER BY h.date DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener registros:', err);
    res.status(500).json({ message: 'Error interno al obtener registros de horas' });
  }
});

// POST /api/hours
router.post('/', authMiddleware, async (req, res) => {
  const { 
    country_id,       //  ID de parámetro con tipo 'pais'
    project_id,       //  ID de parámetro con tipo 'proyecto'
    hour_type_id,     //  ID de parámetro con tipo 'tipo_hora'
    date, 
    hours_quantity, 
    task_description 
  } = req.body;

  const user_id = req.user.id;

  if (!country_id || !project_id || !hour_type_id) {
    return res.status(400).json({ message: 'Faltan IDs requeridos de parámetro (país, proyecto, tipo de hora)' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO work_hours 
        (user_id, country_id, project_id, hour_type_id, date, hours_quantity, task_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, country_id, project_id, hour_type_id, date, hours_quantity, task_description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al registrar horas:', err);
    res.status(500).json({ message: 'Error al registrar horas' });
  }
});

router.get('/export', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT
        wh.id AS id_registro,
        TO_CHAR(wh.date, 'YYYY-MM-DD') AS fecha,
        u.name AS consultor,
        pr.nombre AS project_name,
        pr.cliente AS client_name,
        pm.nombre AS product_manager_name,
        tp.nombre AS hour_type_name,
        cp.nombre AS country_name,
        wh.hours_quantity AS horas,
        wh.task_description AS descripcion,
        TO_CHAR(wh.created_at, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion
      FROM work_hours wh
      JOIN users u ON wh.user_id = u.id
      JOIN parametros pr ON wh.project_id = pr.id AND pr.tipo = 'proyecto'
      LEFT JOIN parametros pm ON pr.project_manager_id = pm.id -- 🔧 Cambiado
      JOIN parametros tp ON wh.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      JOIN parametros cp ON wh.country_id = cp.id AND cp.tipo = 'pais'
      ORDER BY wh.date DESC
    `;

    const result = await pool.query(query);

    const formatted = result.rows.map(row => ({
      id: row.id_registro,
      date: row.fecha,
      consultorName: row.consultor,
      projectName: row.project_name,
      clientName: row.client_name,
      productManagerName: row.product_manager_name || '', // Evita undefined
      hourTypeName: row.hour_type_name,
      countryName: row.country_name,
      hours: row.horas,
      description: row.descripcion,
      createdAt: row.fecha_creacion,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error al exportar registros:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/hours/:id - Obtener un registro de horas específico
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;

  try {
    const result = await pool.query(`
      SELECT h.*, 
             u.name AS user_name,
             cp.id AS country_id,
             cp.nombre AS country_name,
             pr.id AS project_id,
             pr.nombre AS project_name,
             pr.cliente AS cliente,
             tp.id AS hour_type_id,
             tp.nombre AS hour_type_name
      FROM work_hours h
      JOIN users u ON h.user_id = u.id
      JOIN parametros cp ON h.country_id = cp.id AND cp.tipo = 'pais'
      JOIN parametros pr ON h.project_id = pr.id AND pr.tipo = 'proyecto'
      JOIN parametros tp ON h.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      WHERE h.id = $1
    `, [id]);

    const record = result.rows[0];

    if (!record) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    // Si no es admin, validar que el registro sea del mismo usuario
    if (role !== 'administrador' && record.user_id !== userId) {
      return res.status(403).json({ message: 'No autorizado para ver este registro' });
    }

    res.json(record);
  } catch (err) {
    console.error('Error al obtener el registro de horas:', err);
    res.status(500).json({ message: 'Error al consultar el registro' });
  }
});

// PUT /api/hours/:id - Actualizar un registro de horas
router.put('/:id', authMiddleware, async (req, res) => {
  const hourId = req.params.id;
  const { id: userId, role } = req.user;

  const {
    country_id,      // ID de parámetro tipo 'pais'
    project_id,      // ID de parámetro tipo 'proyecto'
    hour_type_id,    // ID de parámetro tipo 'tipo_hora'
    date,
    hours_quantity,
    task_description
  } = req.body;

  try {
    // Validaciones básicas
    if (!country_id || !project_id || !hour_type_id || !date || !hours_quantity) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Verificar que los IDs correspondan a tipos válidos en la tabla parametros
    const validationQuery = `
      SELECT tipo, id FROM parametros 
      WHERE id = ANY($1)
    `;
    const idsToValidate = [country_id, project_id, hour_type_id];
    const validationResult = await pool.query(validationQuery, [idsToValidate]);

    const tiposValidos = {
      pais: false,
      proyecto: false,
      tipo_hora: false
    };

    for (const row of validationResult.rows) {
      if (row.id === country_id && row.tipo === 'pais') tiposValidos.pais = true;
      if (row.id === project_id && row.tipo === 'proyecto') tiposValidos.proyecto = true;
      if (row.id === hour_type_id && row.tipo === 'tipo_hora') tiposValidos.tipo_hora = true;
    }

    if (!tiposValidos.pais || !tiposValidos.proyecto || !tiposValidos.tipo_hora) {
      return res.status(400).json({ message: 'Uno o más IDs no corresponden a tipos válidos en la tabla parámetros' });
    }

    // Actualizar el registro
    await pool.query(`
      UPDATE work_hours
      SET
        country_id = $1,
        project_id = $2,
        hour_type_id = $3,
        date = $4,
        hours_quantity = $5,
        task_description = $6
      WHERE id = $7
    `, [
      country_id,
      project_id,
      hour_type_id,
      date,
      hours_quantity,
      task_description,
      hourId
    ]);

    res.status(200).json({ message: 'Registro actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar horas:', error);
    res.status(500).json({ message: 'Error interno al actualizar horas' });
  }
});




// eliminar un registro de hora

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  console.log(`[DELETE] Intentando eliminar registro ID: ${id}`);
  console.log(`[DELETE] Usuario autenticado: ID=${userId}, Rol=${role}`);

  try {
    if (role !== 'consultor') {
      console.log('[DELETE] Solo consultores pueden eliminar');
      return res.status(403).json({ message: 'Solo consultores pueden eliminar registros' });
    }

    const result = await pool.query(
      'DELETE FROM work_hours WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rowCount === 0) {
      console.log('[DELETE] Registro no encontrado o no pertenece al usuario');
      return res.status(403).json({ message: 'No autorizado o registro no encontrado' });
    }

    console.log('[DELETE] Registro eliminado correctamente');
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar horas:', err);
    res.status(500).json({ message: 'Error al eliminar horas' });
  }
});


// GET /api/hours/user/:id
router.get('/user/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        h.id,
        h.date,
        h.hours_quantity,
        h.task_description,
        u.name AS user,
        u.email,
        cp.id AS country_id,
        cp.nombre AS country_name,
        pr.id AS project_id,
        pr.nombre AS project_name,
        pr.cliente AS client,
        tp.id AS hour_type_id,
        tp.nombre AS hour_type_name
      FROM work_hours h
      JOIN users u ON h.user_id = u.id
      JOIN parametros cp ON h.country_id = cp.id AND cp.tipo = 'pais'
      JOIN parametros pr ON h.project_id = pr.id AND pr.tipo = 'proyecto'
      JOIN parametros tp ON h.hour_type_id = tp.id AND tp.tipo = 'tipo_hora'
      WHERE h.user_id = $1
      ORDER BY h.date DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener horas por usuario:', error);
    res.status(500).json({ message: 'Error interno al obtener horas por usuario' });
  }
});



module.exports = router;
