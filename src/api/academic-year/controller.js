const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all academic years with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [data, total] = await Promise.all([
      prisma.academicYear.findMany({
        skip,
        take: limit,
        orderBy: { yearStart: 'desc' },
        include: {
          periods: {
            orderBy: { term: 'asc' },
          },
        },
      }),
      prisma.academicYear.count(),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Academic years retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return errorResponse(res, 'Failed to fetch academic years');
  }
};

/**
 * Get single academic year by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        periods: {
          orderBy: { term: 'asc' },
        },
      },
    });

    if (!academicYear) {
      return errorResponse(res, 'Academic year not found', 404);
    }

    return successResponse(
      res,
      academicYear,
      'Academic year retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching academic year:', error);
    return errorResponse(res, 'Failed to fetch academic year');
  }
};

/**
 * Create new academic year
 */
const create = async (req, res) => {
  try {
    const { yearStart, yearEnd, label } = req.body;

    if (!yearStart || !yearEnd) {
      return errorResponse(res, 'Year start and year end are required', 400);
    }

    if (yearEnd !== yearStart + 1) {
      return errorResponse(res, 'Year end must be year start + 1', 400);
    }

    // Check if academic year already exists
    const existing = await prisma.academicYear.findUnique({
      where: {
        yearStart_yearEnd: { yearStart, yearEnd },
      },
    });

    if (existing) {
      return errorResponse(res, 'Academic year already exists', 409);
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        yearStart,
        yearEnd,
        label: label || `${yearStart}/${yearEnd}`,
      },
    });

    return successResponse(
      res,
      academicYear,
      'Academic year created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating academic year:', error);
    return errorResponse(res, 'Failed to create academic year');
  }
};

/**
 * Update academic year
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const existing = await prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Academic year not found', 404);
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: { label },
    });

    return successResponse(
      res,
      academicYear,
      'Academic year updated successfully',
    );
  } catch (error) {
    console.error('Error updating academic year:', error);
    return errorResponse(res, 'Failed to update academic year');
  }
};

/**
 * Delete academic year
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Academic year not found', 404);
    }

    await prisma.academicYear.delete({
      where: { id },
    });

    return successResponse(res, null, 'Academic year deleted successfully');
  } catch (error) {
    console.error('Error deleting academic year:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete academic year with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete academic year');
  }
};

/**
 * Get current academic year
 */
const getCurrent = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Academic year typically starts in August/September
    const yearStart = currentMonth >= 8 ? currentYear : currentYear - 1;

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        yearStart: yearStart,
      },
      include: {
        periods: {
          orderBy: { term: 'asc' },
        },
      },
    });

    if (!academicYear) {
      return errorResponse(res, 'Current academic year not found', 404);
    }

    return successResponse(
      res,
      academicYear,
      'Current academic year retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching current academic year:', error);
    return errorResponse(res, 'Failed to fetch current academic year');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getCurrent,
};
