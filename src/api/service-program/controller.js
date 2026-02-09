const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all service programs with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { lecturerId, academicPeriodId, status, search } = req.query;

    const where = {
      ...(lecturerId && { lecturerId }),
      ...(academicPeriodId && { academicPeriodId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { partner: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.serviceProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lecturer: {
            include: {
              user: {
                select: { id: true, fullName: true },
              },
            },
          },
          academicPeriod: {
            include: { academicYear: true },
          },
          impact: true,
        },
      }),
      prisma.serviceProgram.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Service programs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching service programs:', error);
    return errorResponse(res, 'Failed to fetch service programs');
  }
};

/**
 * Get single service program by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceProgram = await prisma.serviceProgram.findUnique({
      where: { id },
      include: {
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
            studyProgram: {
              include: { faculty: true },
            },
          },
        },
        academicPeriod: {
          include: { academicYear: true },
        },
        impact: true,
      },
    });

    if (!serviceProgram) {
      return errorResponse(res, 'Service program not found', 404);
    }

    return successResponse(
      res,
      serviceProgram,
      'Service program retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching service program:', error);
    return errorResponse(res, 'Failed to fetch service program');
  }
};

/**
 * Create new service program
 */
const create = async (req, res) => {
  try {
    const {
      lecturerId,
      academicPeriodId,
      title,
      location,
      partner,
      beneficiariesCount,
      status,
    } = req.body;

    if (!lecturerId || !academicPeriodId || !title) {
      return errorResponse(
        res,
        'Lecturer ID, academic period ID, and title are required',
        400,
      );
    }

    // Validate lecturer exists
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
    });
    if (!lecturer) {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    // Validate academic period exists
    const academicPeriod = await prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });
    if (!academicPeriod) {
      return errorResponse(res, 'Academic period not found', 404);
    }

    const serviceProgram = await prisma.serviceProgram.create({
      data: {
        lecturerId,
        academicPeriodId,
        title,
        location,
        partner,
        beneficiariesCount,
        status: status || 'PLANNED',
      },
      include: {
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
        academicPeriod: {
          include: { academicYear: true },
        },
      },
    });

    return successResponse(
      res,
      serviceProgram,
      'Service program created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating service program:', error);
    return errorResponse(res, 'Failed to create service program');
  }
};

/**
 * Update service program
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location, partner, beneficiariesCount, status } = req.body;

    const existing = await prisma.serviceProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Service program not found', 404);
    }

    const serviceProgram = await prisma.serviceProgram.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(location !== undefined && { location }),
        ...(partner !== undefined && { partner }),
        ...(beneficiariesCount !== undefined && { beneficiariesCount }),
        ...(status && { status }),
      },
      include: {
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
        academicPeriod: {
          include: { academicYear: true },
        },
        impact: true,
      },
    });

    return successResponse(
      res,
      serviceProgram,
      'Service program updated successfully',
    );
  } catch (error) {
    console.error('Error updating service program:', error);
    return errorResponse(res, 'Failed to update service program');
  }
};

/**
 * Delete service program
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.serviceProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Service program not found', 404);
    }

    await prisma.serviceProgram.delete({
      where: { id },
    });

    return successResponse(res, null, 'Service program deleted successfully');
  } catch (error) {
    console.error('Error deleting service program:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete service program with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete service program');
  }
};

/**
 * Get service programs by lecturer
 */
const getByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId, status } = req.query;

    const where = {
      lecturerId,
      ...(academicPeriodId && { academicPeriodId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.serviceProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          academicPeriod: {
            include: { academicYear: true },
          },
          impact: true,
        },
      }),
      prisma.serviceProgram.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer service programs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer service programs:', error);
    return errorResponse(res, 'Failed to fetch lecturer service programs');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getByLecturer,
};
