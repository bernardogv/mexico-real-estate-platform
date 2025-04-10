const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // This would actually verify the token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.userId = decoded.userId;
    
    // For now, just mock it
    req.userId = 'mock_user_id';
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
