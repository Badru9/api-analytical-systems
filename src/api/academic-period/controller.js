const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all academic periods with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { academicYearId, term } = req.query;

    const where = {
      ...(academicYearId && { academicYearId }),
      ...(term && { term }),
    };

    const [data, total] = await Promise.all([
      prisma.academicPeriod.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ academicYear: { yearStart: 'desc' } }, { term: 'asc' }],
        include: {
          academicYear: true,
          _count: {
            select: {
              offerings: true,
              researchProjects: true,
              servicePrograms: true,
            },
          },
        },
      }),
      prisma.academicPeriod.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Academic periods retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching academic periods:', error);
    return errorResponse(res, 'Failed to fetch academic periods');
  }
};

/**
 * Get single academic period by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const academicPeriod = await prisma.academicPeriod.findUnique({
      where: { id },
      include: {
        academicYear: true,
        _count: {
          select: {
            offerings: true,
            researchProjects: true,
            servicePrograms: true,
            evidences: true,
            reviews: true,
          },
        },
      },
    });

    if (!academicPeriod) {
      return errorResponse(res, 'Academic period not found', 404);
    }

    return successResponse(
      res,
      academicPeriod,
      'Academic period retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching academic period:', error);
    return errorResponse(res, 'Failed to fetch academic period');
  }
};

/**
 * Create new academic period
 */
const create = async (req, res) => {
  try {
    const {
      academicYearId,
      term,
      startDate,
      endDate,
      bkdDeadline,
      researchDeadline,
      serviceDeadline,
    } = req.body;

    if (!academicYearId || !term) {
      return errorResponse(res, 'Academic year ID and term are required', 400);
    }

    // Validate term
    if (!['GANJIL', 'GENAP'].includes(term)) {
      return errorResponse(res, 'Term must be GANJIL or GENAP', 400);
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return errorResponse(res, 'Academic year not found', 404);
    }

    // Check if period already exists
    const existing = await prisma.academicPeriod.findUnique({
      where: {
        academicYearId_term: { academicYearId, term },
      },
    });

    if (existing) {
      return errorResponse(res, 'Academic period already exists', 409);
    }

    const academicPeriod = await prisma.academicPeriod.create({
      data: {
        academicYearId,
        term,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        bkdDeadline: bkdDeadline ? new Date(bkdDeadline) : null,
        researchDeadline: researchDeadline ? new Date(researchDeadline) : null,
        serviceDeadline: serviceDeadline ? new Date(serviceDeadline) : null,
      },
      include: {
        academicYear: true,
      },
    });

    return successResponse(
      res,
      academicPeriod,
      'Academic period created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating academic period:', error);
    return errorResponse(res, 'Failed to create academic period');
  }
};

/**
 * Update academic period
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      bkdDeadline,
      researchDeadline,
      serviceDeadline,
    } = req.body;

    const existing = await prisma.academicPeriod.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Academic period not found', 404);
    }

    const academicPeriod = await prisma.academicPeriod.update({
      where: { id },
      data: {
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(bkdDeadline !== undefined && {
          bkdDeadline: bkdDeadline ? new Date(bkdDeadline) : null,
        }),
        ...(researchDeadline !== undefined && {
          researchDeadline: researchDeadline
            ? new Date(researchDeadline)
            : null,
        }),
        ...(serviceDeadline !== undefined && {
          serviceDeadline: serviceDeadline ? new Date(serviceDeadline) : null,
        }),
      },
      include: {
        academicYear: true,
      },
    });

    return successResponse(
      res,
      academicPeriod,
      'Academic period updated successfully',
    );
  } catch (error) {
    console.error('Error updating academic period:', error);
    return errorResponse(res, 'Failed to update academic period');
  }
};

/**
 * Delete academic period
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.academicPeriod.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Academic period not found', 404);
    }

    await prisma.academicPeriod.delete({
      where: { id },
    });

    return successResponse(res, null, 'Academic period deleted successfully');
  } catch (error) {
    console.error('Error deleting academic period:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete academic period with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete academic period');
  }
};

/**
 * Get current academic period
 */
const getCurrent = async (req, res) => {
  try {
    const currentDate = new Date();

    // Find period where current date is between start and end
    let academicPeriod = await prisma.academicPeriod.findFirst({
      where: {
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
      },
      include: {
        academicYear: true,
      },
    });

    // If not found by date range, find by current year
    if (!academicPeriod) {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const yearStart = currentMonth >= 8 ? currentYear : currentYear - 1;
      const term = currentMonth >= 2 && currentMonth <= 7 ? 'GENAP' : 'GANJIL';

      academicPeriod = await prisma.academicPeriod.findFirst({
        where: {
          academicYear: { yearStart },
          term,
        },
        include: {
          academicYear: true,
        },
      });
    }

    if (!academicPeriod) {
      return errorResponse(res, 'Current academic period not found', 404);
    }

    return successResponse(
      res,
      academicPeriod,
      'Current academic period retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching current academic period:', error);
    return errorResponse(res, 'Failed to fetch current academic period');
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
