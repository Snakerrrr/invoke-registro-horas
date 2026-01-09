// middlewares/checkRole.js
function checkRole(requiredRole) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(403).json({ message: 'Rol no proporcionado' });
    }
    if (userRole !== requiredRole) {
      return res.status(403).json({ message: `Acceso denegado: se requiere rol ${requiredRole}` });
    }
    next();
  };
}
module.exports = checkRole;
