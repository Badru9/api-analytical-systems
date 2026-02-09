const prisma = require('../../db/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../middleware/auth');
const { successResponse, errorResponse } = require('../../utils/response');

const SALT_ROUNDS = 10;

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { institutionId, email, password, fullName, roleNames } = req.body;

    if (!institutionId || !email || !password || !fullName) {
      return errorResponse(
        res,
        'Institution ID, email, password, and full name are required',
        400,
      );
    }

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return errorResponse(res, 'Institution not found', 404);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        institutionId,
        email,
        passwordHash,
        fullName,
        roles: roleNames?.length
          ? {
              create: await Promise.all(
                roleNames.map(async (roleName) => {
                  const role = await prisma.role.findUnique({
                    where: { name: roleName },
                  });
                  return { roleId: role.id };
                }),
              ),
            }
          : undefined,
      },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id);

    return successResponse(
      res,
      {
        user: userWithoutPassword,
        token,
      },
      'User registered successfully',
      201,
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return errorResponse(res, 'Failed to register user');
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
        roles: {
          include: {
            role: true,
          },
        },
        lecturer: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is inactive', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id);

    return successResponse(
      res,
      {
        user: userWithoutPassword,
        token,
      },
      'Login successful',
    );
  } catch (error) {
    console.error('Error logging in:', error);
    return errorResponse(res, 'Failed to login');
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        institution: true,
        roles: {
          include: {
            role: true,
          },
        },
        lecturer: {
          include: {
            studyProgram: {
              include: {
                faculty: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    return successResponse(
      res,
      userWithoutPassword,
      'Profile retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return errorResponse(res, 'Failed to fetch profile');
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    // Check if new email conflicts
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.user.id },
        },
      });

      if (existingUser) {
        return errorResponse(res, 'Email already in use', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
      },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return successResponse(
      res,
      userWithoutPassword,
      'Profile updated successfully',
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return errorResponse(res, 'Failed to update profile');
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(
        res,
        'Current password and new password are required',
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
    return errorResponse(res, 'Failed to change password');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
