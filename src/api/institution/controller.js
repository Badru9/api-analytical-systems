const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all institutions with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search } = req.query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { faculties: true, users: true },
          },
        },
      }),
      prisma.institution.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Institutions retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return errorResponse(res, 'Failed to fetch institutions');
  }
};

/**
 * Get single institution by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        faculties: {
          include: {
            studyPrograms: true,
          },
        },
        _count: {
          select: { faculties: true, users: true },
        },
      },
    });

    if (!institution) {
      return errorResponse(res, 'Institution not found', 404);
    }

    return successResponse(
      res,
      institution,
      'Institution retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching institution:', error);
    return errorResponse(res, 'Failed to fetch institution');
  }
};

/**
 * Create new institution
 */
const create = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return errorResponse(res, 'Name and code are required', 400);
    }

    // Check if code already exists
    const existing = await prisma.institution.findUnique({
      where: { code },
    });

    if (existing) {
      return errorResponse(res, 'Institution code already exists', 409);
    }

    const institution = await prisma.institution.create({
      data: { name, code },
    });

    return successResponse(
      res,
      institution,
      'Institution created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating institution:', error);
    return errorResponse(res, 'Failed to create institution');
  }
};

/**
 * Update institution
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    // Check if institution exists
    const existing = await prisma.institution.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Institution not found', 404);
    }

    // Check if new code conflicts with another institution
    if (code && code !== existing.code) {
      const codeExists = await prisma.institution.findUnique({
        where: { code },
      });

      if (codeExists) {
        return errorResponse(res, 'Institution code already exists', 409);
      }
    }

    const institution = await prisma.institution.update({
      where: { id },
      data: { name, code },
    });

    return successResponse(
      res,
      institution,
      'Institution updated successfully',
    );
  } catch (error) {
    console.error('Error updating institution:', error);
    return errorResponse(res, 'Failed to update institution');
  }
};

/**
 * Delete institution
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.institution.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Institution not found', 404);
    }

    await prisma.institution.delete({
      where: { id },
    });

    return successResponse(res, null, 'Institution deleted successfully');
  } catch (error) {
    console.error('Error deleting institution:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete institution with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete institution');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
