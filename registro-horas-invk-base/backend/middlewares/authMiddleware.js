// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      message: 'Token no proporcionado',
      code: 'NO_TOKEN',
      shouldLogout: true 
    });
  }
  
  const token = authHeader.split(' ')[1]; // "Bearer token"
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Token malformado o ausente',
      code: 'INVALID_TOKEN_FORMAT',
      shouldLogout: true 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si el token está próximo a expirar (5 minutos antes)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    const fiveMinutes = 5 * 60;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tokenExpiry: decoded.exp,
      timeUntilExpiry: timeUntilExpiry
    };
    
    // Si el token expira en menos de 5 minutos, enviar advertencia
    if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
      res.setHeader('X-Token-Expiry-Warning', 'true');
      res.setHeader('X-Token-Expires-In', timeUntilExpiry.toString());
    }
    
    next();
  } catch (err) {
    let errorCode = 'TOKEN_INVALID';
    let shouldLogout = true;
    
    if (err.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      errorCode = 'TOKEN_MALFORMED';
    }
    
    return res.status(403).json({ 
      message: 'Token inválido o expirado',
      code: errorCode,
      shouldLogout: shouldLogout,
      details: err.message 
    });
  }
}

module.exports = authMiddleware;
