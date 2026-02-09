const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all faculties with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, institutionId } = req.query;

    const where = {
      ...(institutionId && { institutionId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          institution: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { studyPrograms: true },
          },
        },
      }),
      prisma.faculty.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Faculties retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return errorResponse(res, 'Failed to fetch faculties');
  }
};

/**
 * Get single faculty by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        institution: true,
        studyPrograms: true,
        _count: {
          select: { studyPrograms: true },
        },
      },
    });

    if (!faculty) {
      return errorResponse(res, 'Faculty not found', 404);
    }

    return successResponse(res, faculty, 'Faculty retrieved successfully');
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return errorResponse(res, 'Failed to fetch faculty');
  }
};

/**
 * Create new faculty
 */
const create = async (req, res) => {
  try {
    const { institutionId, name, code } = req.body;

    if (!institutionId || !name || !code) {
      return errorResponse(
        res,
        'Institution ID, name, and code are required',
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

    // Check if code already exists in this institution
    const existing = await prisma.faculty.findUnique({
      where: {
        institutionId_code: { institutionId, code },
      },
    });

    if (existing) {
      return errorResponse(
        res,
        'Faculty code already exists in this institution',
        409,
      );
    }

    const faculty = await prisma.faculty.create({
      data: { institutionId, name, code },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(res, faculty, 'Faculty created successfully', 201);
  } catch (error) {
    console.error('Error creating faculty:', error);
    return errorResponse(res, 'Failed to create faculty');
  }
};

/**
 * Update faculty
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const existing = await prisma.faculty.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Faculty not found', 404);
    }

    // Check if new code conflicts
    if (code && code !== existing.code) {
      const codeExists = await prisma.faculty.findUnique({
        where: {
          institutionId_code: { institutionId: existing.institutionId, code },
        },
      });

      if (codeExists) {
        return errorResponse(
          res,
          'Faculty code already exists in this institution',
          409,
        );
      }
    }

    const faculty = await prisma.faculty.update({
      where: { id },
      data: { name, code },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(res, faculty, 'Faculty updated successfully');
  } catch (error) {
    console.error('Error updating faculty:', error);
    return errorResponse(res, 'Failed to update faculty');
  }
};

/**
 * Delete faculty
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.faculty.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Faculty not found', 404);
    }

    await prisma.faculty.delete({
      where: { id },
    });

    return successResponse(res, null, 'Faculty deleted successfully');
  } catch (error) {
    console.error('Error deleting faculty:', error);
    if (error.code === 'P2003') {
      return errorResponse(res, 'Cannot delete faculty with related data', 400);
    }
    return errorResponse(res, 'Failed to delete faculty');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
