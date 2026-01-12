function requireAdmin(req, res, next) {
  console.log('🛡️ Middleware requireAdmin:', req.user);
  if (!req.user || req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
  }
  next();
}
module.exports = requireAdmin;
