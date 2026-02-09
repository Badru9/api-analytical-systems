const prisma = require('../../db/database');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Get all evidence types
 */
const getAll = async (req, res) => {
  try {
    const { requiredForBkd } = req.query;

    const where = {
      ...(requiredForBkd !== undefined && {
        requiredForBkd: requiredForBkd === 'true',
      }),
    };

    const evidenceTypes = await prisma.evidenceType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { evidences: true },
        },
      },
    });

    return successResponse(
      res,
      evidenceTypes,
      'Evidence types retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching evidence types:', error);
    return errorResponse(res, 'Failed to fetch evidence types');
  }
};

/**
 * Get single evidence type by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const evidenceType = await prisma.evidenceType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { evidences: true },
        },
      },
    });

    if (!evidenceType) {
      return errorResponse(res, 'Evidence type not found', 404);
    }

    return successResponse(
      res,
      evidenceType,
      'Evidence type retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching evidence type:', error);
    return errorResponse(res, 'Failed to fetch evidence type');
  }
};

/**
 * Create new evidence type
 */
const create = async (req, res) => {
  try {
    const { code, name, description, requiredForBkd } = req.body;

    if (!code || !name) {
      return errorResponse(res, 'Code and name are required', 400);
    }

    // Check if code already exists
    const existing = await prisma.evidenceType.findUnique({
      where: { code },
    });

    if (existing) {
      return errorResponse(res, 'Evidence type code already exists', 409);
    }

    const evidenceType = await prisma.evidenceType.create({
      data: {
        code,
        name,
        description,
        requiredForBkd: requiredForBkd || false,
      },
    });

    return successResponse(
      res,
      evidenceType,
      'Evidence type created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating evidence type:', error);
    return errorResponse(res, 'Failed to create evidence type');
  }
};

/**
 * Update evidence type
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, requiredForBkd } = req.body;

    const existing = await prisma.evidenceType.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Evidence type not found', 404);
    }

    // Check if new code conflicts
    if (code && code !== existing.code) {
      const codeExists = await prisma.evidenceType.findUnique({
        where: { code },
      });

      if (codeExists) {
        return errorResponse(res, 'Evidence type code already exists', 409);
      }
    }

    const evidenceType = await prisma.evidenceType.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(requiredForBkd !== undefined && { requiredForBkd }),
      },
    });

    return successResponse(
      res,
      evidenceType,
      'Evidence type updated successfully',
    );
  } catch (error) {
    console.error('Error updating evidence type:', error);
    return errorResponse(res, 'Failed to update evidence type');
  }
};

/**
 * Delete evidence type
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.evidenceType.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Evidence type not found', 404);
    }

    await prisma.evidenceType.delete({
      where: { id },
    });

    return successResponse(res, null, 'Evidence type deleted successfully');
  } catch (error) {
    console.error('Error deleting evidence type:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete evidence type with related evidences',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete evidence type');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
