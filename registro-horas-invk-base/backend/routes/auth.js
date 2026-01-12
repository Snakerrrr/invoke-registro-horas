// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Credenciales inválidas' });
    
    // Generar token con expiración de 1 hora
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Decodificar token para obtener información de expiración
    const decoded = jwt.decode(token);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role 
      },
      expiresAt: decoded.exp,
      expiresIn: 3600 // 1 hora en segundos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Endpoint para renovar token
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    // Generar nuevo token
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const decoded = jwt.decode(newToken);
    
    res.json({ 
      token: newToken,
      expiresAt: decoded.exp,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(500).json({ message: 'Error renovando token' });
  }
});

// Endpoint para verificar estado del token
router.get('/verify-token', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({ 
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      expiresAt: user.tokenExpiry,
      timeUntilExpiry: user.timeUntilExpiry
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ message: 'Error verificando token' });
  }
});

module.exports = router;
