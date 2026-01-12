const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');


// GET /api/parametros/
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parametros ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    res.status(500).json({ message: 'Error al obtener parámetros' });
  }
});


// GET /api/parametros/:tipo
router.get('/:tipo', authMiddleware, async (req, res) => {
  const { tipo } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM parametros WHERE tipo = $1 ORDER BY nombre ASC',
      [tipo]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener parámetros:', err);
    res.status(500).json({ message: 'Error al obtener parámetros' });
  }
});

// POST /api/parametros
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const {
    tipo,
    nombre,
    codigo,
    icono,
    cliente,
    relacionado_id,
    project_manager_id
  } = req.body;

  try {
    if (!tipo || !nombre) {
      return res.status(400).json({ message: 'Tipo y nombre son obligatorios' });
    }

    if (tipo === 'proyecto') {
      if (!relacionado_id || !project_manager_id || !cliente) {
        return res.status(400).json({ message: 'Faltan datos obligatorios para tipo proyecto' });
      }

      await pool.query(`
        INSERT INTO parametros (tipo, nombre, cliente, relacionado_id, project_manager_id, activo)
        VALUES ('proyecto', $1, $2, $3, $4, true)
      `, [nombre, cliente, relacionado_id, project_manager_id]);

    } else if (tipo === 'pais') {
      if (!codigo || !icono) {
        return res.status(400).json({ message: 'Código e icono son obligatorios para tipo país' });
      }

      await pool.query(`
        INSERT INTO parametros (tipo, nombre, codigo, icono, activo)
        VALUES ('pais', $1, $2, $3, true)
      `, [nombre, codigo, icono]);

    } else if (tipo === 'tipo_hora') {
      await pool.query(`
        INSERT INTO parametros (tipo, nombre, activo)
        VALUES ('tipo_hora', $1, true)
      `, [nombre]);

    } else if (tipo === 'pm') {
      await pool.query(`
        INSERT INTO parametros (tipo, nombre, cliente, activo)
        VALUES ('pm', $1, $2, true)
      `, [nombre, cliente]);

    } else {
      return res.status(400).json({ message: 'Tipo no soportado' });
    }

    res.status(201).json({ message: 'Parámetro creado correctamente' });
  } catch (error) {
    console.error('Error al crear parámetro:', error);
    res.status(500).json({ message: 'Error interno al crear parámetro' });
  }
});


// GET /api/parametros/proyectos/:pais_id
router.get('/proyectos/:pais_id', authMiddleware, async (req, res) => {
  const { pais_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM parametros WHERE tipo = $1 AND relacionado_id = $2 ORDER BY nombre ASC',
      ['proyecto', pais_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener proyectos por pais:', err);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
});


// PATCH /api/parametros/proyecto/:id/desactivar
router.patch('/proyecto/:id/desactivar', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  try {
    const result = await pool.query(
      `UPDATE parametros 
       SET activo = false 
       WHERE id = $1 AND tipo = 'proyecto'
       RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Proyecto no encontrado o no es del tipo "proyecto"' });
    }
    res.json({ message: 'Proyecto desactivado correctamente', proyecto: result.rows[0] });
  } catch (error) {
    console.error('Error al desactivar proyecto:', error);
    res.status(500).json({ message: 'Error al desactivar el proyecto' });
  }
});
// PATCH /api/parametros/proyecto/:id/reactivar
router.patch('/proyecto/:id/reactivar', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  try {
    const result = await pool.query(
      `UPDATE parametros 
       SET activo = true 
       WHERE id = $1 AND tipo = 'proyecto'
       RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Proyecto no encontrado o no es del tipo "proyecto"' });
    }
    res.json({ message: 'Proyecto reactivado correctamente', proyecto: result.rows[0] });
  } catch (error) {
    console.error('Error al reactivar proyecto:', error);
    res.status(500).json({ message: 'Error al reactivar el proyecto' });
  }
});

// modificar parametros
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const parametroId = req.params.id;
  const {
    tipo,
    nombre,
    codigo,
    icono,
    cliente,
    relacionado_id,
    project_manager_id,
    activo
  } = req.body;

  try {
    if (!tipo || !nombre) {
      return res.status(400).json({ message: 'Tipo y nombre son obligatorios' });
    }

    if (tipo === 'proyecto') {
      await pool.query(`
        UPDATE parametros SET
          nombre = $1,
          cliente = $2,
          relacionado_id = $3,
          project_manager_id = $4,
          activo = $5
        WHERE id = $6 AND tipo = 'proyecto'
      `, [nombre, cliente, relacionado_id, project_manager_id, activo, parametroId]);

    } else if (tipo === 'pais') {
      await pool.query(`
        UPDATE parametros SET
          nombre = $1,
          codigo = $2,
          icono = $3,
          activo = $4
        WHERE id = $5 AND tipo = 'pais'
      `, [nombre, codigo, icono, activo, parametroId]);

    } else if (tipo === 'tipo_hora') {
      await pool.query(`
        UPDATE parametros SET
          nombre = $1,
          activo = $2
        WHERE id = $3 AND tipo = 'tipo_hora'
      `, [nombre, activo, parametroId]);

    } else if (tipo === 'pm') {
      await pool.query(`
        UPDATE parametros SET
          nombre = $1,
          cliente = $2,
          activo = $3
        WHERE id = $4 AND tipo = 'pm'
      `, [nombre, cliente, activo, parametroId]);

    } else {
      return res.status(400).json({ message: 'Tipo no soportado para edición' });
    }

    res.json({ message: 'Parámetro actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar parámetro:', error);
    res.status(500).json({ message: 'Error interno al actualizar parámetro' });
  }
});


// DELETE /api/parametros/:id
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const parametroId = req.params.id;

  try {
    // Obtener el parámetro a eliminar
    const result = await pool.query('SELECT * FROM parametros WHERE id = $1', [parametroId]);
    const parametro = result.rows[0];

    if (!parametro) {
      return res.status(404).json({ message: 'Parámetro no encontrado' });
    }

    // Si es un PM, verificar que no esté vinculado a proyectos
    if (parametro.tipo === 'pm') {
      const pmId = parametro.id;

      const pmLinked = await pool.query(
        `SELECT COUNT(*) FROM projects WHERE project_manager_id = $1`,
        [pmId]
      );

      const count = Number(pmLinked.rows[0].count);

      if (count > 0) {
        // En lugar de eliminar, lo desactivamos (soft delete)
        await pool.query(
          `UPDATE parametros SET activo = false WHERE id = $1`,
          [pmId]
        );

        return res.status(200).json({
          message: `PM con ID ${pmId} desactivado (soft delete) porque está asociado a ${count} proyecto(s)`,
        });
      }
    }

    // Para otros tipos o PMs sin uso, simplemente eliminar
    await pool.query(`DELETE FROM parametros WHERE id = $1`, [parametroId]);
    res.status(200).json({ message: 'Parámetro eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar parámetro:', error);
    res.status(500).json({ message: 'Error interno al eliminar parámetro' });
  }
});


module.exports = router;