/**
 * Middleware untuk authorization berdasarkan role
 * @param  {...string} allowedRoles - Role yang diizinkan (DOSEN, KAPRODI, LPPM, LPM, DEKAN, ADMIN)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles;

    // ADMIN memiliki akses ke semua
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    // Periksa apakah user memiliki salah satu role yang diizinkan
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

/**
 * Middleware untuk memastikan user hanya bisa mengakses data dirinya sendiri
 * kecuali jika memiliki role tertentu
 */
const authorizeOwnerOrRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles;
    const targetLecturerId = req.params.lecturerId || req.body.lecturerId;

    // ADMIN selalu bisa akses
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    // Jika user adalah owner (lecturerId sama)
    if (req.user.lecturerId && req.user.lecturerId === targetLecturerId) {
      return next();
    }

    // Jika memiliki salah satu role yang diizinkan
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (hasRole) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.',
    });
  };
};

module.exports = {
  authorize,
  authorizeOwnerOrRoles,
};
