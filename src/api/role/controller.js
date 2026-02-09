const prisma = require('../../db/database');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Get all roles
 */
const getAll = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return successResponse(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    console.error('Error fetching roles:', error);
    return errorResponse(res, 'Failed to fetch roles');
  }
};

/**
 * Get single role by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });

    if (!role) {
      return errorResponse(res, 'Role not found', 404);
    }

    return successResponse(res, role, 'Role retrieved successfully');
  } catch (error) {
    console.error('Error fetching role:', error);
    return errorResponse(res, 'Failed to fetch role');
  }
};

/**
 * Create new role
 */
const create = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return errorResponse(res, 'Role name is required', 400);
    }

    // Check if role name already exists
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      return errorResponse(res, 'Role name already exists', 409);
    }

    const role = await prisma.role.create({
      data: { name, description },
    });

    return successResponse(res, role, 'Role created successfully', 201);
  } catch (error) {
    console.error('Error creating role:', error);
    return errorResponse(res, 'Failed to create role');
  }
};

/**
 * Update role
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Role not found', 404);
    }

    const role = await prisma.role.update({
      where: { id },
      data: { description },
    });

    return successResponse(res, role, 'Role updated successfully');
  } catch (error) {
    console.error('Error updating role:', error);
    return errorResponse(res, 'Failed to update role');
  }
};

/**
 * Delete role
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Role not found', 404);
    }

    await prisma.role.delete({
      where: { id },
    });

    return successResponse(res, null, 'Role deleted successfully');
  } catch (error) {
    console.error('Error deleting role:', error);
    if (error.code === 'P2003') {
      return errorResponse(res, 'Cannot delete role with assigned users', 400);
    }
    return errorResponse(res, 'Failed to delete role');
  }
};

/**
 * Assign role to user
 */
const assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return errorResponse(res, 'User ID and Role ID are required', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return errorResponse(res, 'Role not found', 404);
    }

    // Check if already assigned
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (existing) {
      return errorResponse(res, 'Role already assigned to user', 409);
    }

    const userRole = await prisma.userRole.create({
      data: { userId, roleId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        role: true,
      },
    });

    return successResponse(res, userRole, 'Role assigned successfully', 201);
  } catch (error) {
    console.error('Error assigning role:', error);
    return errorResponse(res, 'Failed to assign role');
  }
};

/**
 * Remove role from user
 */
const removeRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return errorResponse(res, 'User ID and Role ID are required', 400);
    }

    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (!existing) {
      return errorResponse(res, 'User does not have this role', 404);
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    return successResponse(res, null, 'Role removed successfully');
  } catch (error) {
    console.error('Error removing role:', error);
    return errorResponse(res, 'Failed to remove role');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  assignRole,
  removeRole,
};
