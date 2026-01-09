const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener países
router.get('/countries', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM countries ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener países:', err);
    res.status(500).json({ message: 'Error al obtener países' });
  }
});

// Obtener tipos de hora
router.get('/hour-types', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM hour_types ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener tipos de hora:', err);
    res.status(500).json({ message: 'Error al obtener tipos de hora' });
  }
});

// Obtener proyectos
router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, c.name AS country
      FROM projects p
      LEFT JOIN countries c ON p.country_id = c.id
      ORDER BY p.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener proyectos:', err);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
});

module.exports = router;
