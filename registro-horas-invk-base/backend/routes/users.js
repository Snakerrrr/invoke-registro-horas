// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.password, r.name AS role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

//registrar usuario
router.post('/register', authMiddleware, async (req, res) => {
  const { email, password, name, roleName = 'consultor' } = req.body;

  // Bloquear si no es administrador
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'Solo los administradores pueden crear usuarios' });
  }

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const finalRole = roleName.trim().toLowerCase();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)',
      [finalRole]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: 'Rol no válido' });
    }

    const roleId = roleResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, name, role_id, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role_id, role`,
      [email, hashedPassword, name, roleId, finalRole]
    );

    const newUser = result.rows[0];

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta protegida
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Acceso permitido',
    user: req.user
  });
});


//listar usuarios
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    const result = await pool.query(`
      SELECT id, name, email, role, role_id, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /api/users/me - Actualizar perfil del usuario autenticado
router.put('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    telefono,
    pais,
    direccion,
    biografia,
    idioma,
    avatar_url
  } = req.body;

  try {
    const result = await pool.query(`
      UPDATE users
      SET telefono = $1,
          pais = $2,
          direccion = $3,
          biografia = $4,
          idioma = $5,
          avatar_url = $6
      WHERE id = $7
      RETURNING id, name, email, telefono, pais, direccion, biografia, idioma, avatar_url;
    `, [telefono, pais, direccion, biografia, idioma, avatar_url, userId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno al actualizar usuario' });
  }
});

// Cambiar contraseña del usuario logueado
router.put('/change-password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'La nueva contraseña y la confirmación no coinciden' });
  }

  try {
    // 1. Buscar contraseña actual en la BD
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. Comparar con bcrypt
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    // 3. Hashear nueva contraseña y actualizar
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// actualizar usuarios (menú de Gestion de usuarios)
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { name, email, role, password } = req.body;

  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    // Verifica que el usuario existe
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtiene el ID del rol
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)',
      [role.trim()]
    );
    if (roleResult.rowCount === 0) {
      return res.status(400).json({ message: 'Rol no válido' });
    }

    const roleId = roleResult.rows[0].id;

    // Si viene contraseña, actualízala también
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users
         SET name = $1, email = $2, role = $3, role_id = $4, password = $5, updated_at = NOW()
         WHERE id = $6`,
        [name, email, role, roleId, hashedPassword, userId]
      );
    } else {
      // Solo actualiza sin password
      await pool.query(
        `UPDATE users
         SET name = $1, email = $2, role = $3, role_id = $4, updated_at = NOW()
         WHERE id = $5`,
        [name, email, role, roleId, userId]
      );
    }

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


//eliminar usuario
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;

  // Solo administradores pueden eliminar usuarios
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    // Verifica si el usuario existe
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Elimina el usuario
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, telefono, pais, direccion, biografia, idioma, avatar_url
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
});

module.exports = router;
