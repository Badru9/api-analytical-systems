const jwt = require('jsonwebtoken');
const prisma = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware untuk verifikasi JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        lecturer: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      institutionId: user.institutionId,
      roles: user.roles.map((ur) => ur.role.name),
      lecturerId: user.lecturer?.id || null,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
};

module.exports = {
  authenticate,
  generateToken,
  JWT_SECRET,
};
