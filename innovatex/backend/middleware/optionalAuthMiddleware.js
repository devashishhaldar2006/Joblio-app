const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = optionalAuthMiddleware;
