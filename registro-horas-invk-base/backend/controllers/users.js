const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
   'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
  [name, email, hashedPassword, role || 'consultor']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
  const result = await db.query(
   'SELECT id, name, email, password, role FROM users WHERE email = $1',
   [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

 const payload = { id: user.id, email: user.email, role: user.role };
 const token = jwt.sign(payload, process.env.JWT_SECRET, {
   expiresIn: process.env.JWT_EXPIRES_IN,
 });
 res.json({
   token,
   user: {
     id:   user.id,
     name: user.name,
     email: user.email,
     role: user.role,
   }
 });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { registerUser, loginUser };

