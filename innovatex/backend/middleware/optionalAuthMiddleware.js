const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'innovatex_super_secret_jwt_key_987654321'
    );
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = optionalAuthMiddleware;
