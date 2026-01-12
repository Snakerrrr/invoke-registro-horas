// routes/projects.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');


//Obtener proyectos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.cliente, 
        p.country_id,
        p.project_manager_id,
        pm.nombre AS project_manager_name,
        c.name AS country_name,
        p.activo
      FROM projects p
      JOIN countries c ON p.country_id = c.id
      LEFT JOIN parametros pm ON pm.id = p.project_manager_id AND pm.tipo = 'pm'
      ORDER BY p.name ASC
    `);

    // Transforma el resultado según lo que espera el frontend
    const projects = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      client: row.cliente,
      countryId: row.country_id,
      productManagerId: row.project_manager_id,
      productManagerName: row.project_manager_name || "N/A",
      status: row.activo ? "active" : "inactive"
    }));

    res.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error interno al obtener proyectos' });
  }
});


module.exports = router;
