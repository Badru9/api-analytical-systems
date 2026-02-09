const prisma = require('../../db/database');
const bcrypt = require('bcrypt');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

const SALT_ROUNDS = 10;

/**
 * Get all users with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, institutionId, isActive } = req.query;

    const where = {
      ...(institutionId && { institutionId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,
          institution: {
            select: { id: true, name: true, code: true },
          },
          roles: {
            include: {
              role: true,
            },
          },
          lecturer: {
            select: { id: true, nidn: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Users retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse(res, 'Failed to fetch users');
  }
};

/**
 * Get single user by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
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

    return successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    console.error('Error fetching user:', error);
    return errorResponse(res, 'Failed to fetch user');
  }
};

/**
 * Create new user (admin function)
 */
const create = async (req, res) => {
  try {
    const { institutionId, email, password, fullName, isActive, roleNames } =
      req.body;

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

    // Get role IDs
    let roleConnections = [];
    if (roleNames?.length) {
      const roles = await prisma.role.findMany({
        where: { name: { in: roleNames } },
      });
      roleConnections = roles.map((role) => ({ roleId: role.id }));
    }

    const user = await prisma.user.create({
      data: {
        institutionId,
        email,
        passwordHash,
        fullName,
        isActive: isActive ?? true,
        roles: roleConnections.length ? { create: roleConnections } : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        institutionId: true,
        createdAt: true,
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

    return successResponse(res, user, 'User created successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(res, 'Failed to create user');
  }
};

/**
 * Update user
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, isActive, roleNames } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if new email conflicts
    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return errorResponse(res, 'Email already in use', 409);
      }
    }

    // Update roles if provided
    if (roleNames !== undefined) {
      // Delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Add new roles
      if (roleNames.length) {
        const roles = await prisma.role.findMany({
          where: { name: { in: roleNames } },
        });

        await prisma.userRole.createMany({
          data: roles.map((role) => ({ userId: id, roleId: role.id })),
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
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

    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(res, 'Failed to update user');
  }
};

/**
 * Delete user
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'User not found', 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2003') {
      return errorResponse(res, 'Cannot delete user with related data', 400);
    }
    return errorResponse(res, 'Failed to delete user');
  }
};

/**
 * Reset user password (admin function)
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 'New password is required', 400);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'User not found', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    return errorResponse(res, 'Failed to reset password');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  resetPassword,
};
