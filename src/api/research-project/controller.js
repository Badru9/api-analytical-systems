const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all research projects with pagination
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
          { theme: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.researchProject.findMany({
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
          _count: {
            select: { outputs: true },
          },
        },
      }),
      prisma.researchProject.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Research projects retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching research projects:', error);
    return errorResponse(res, 'Failed to fetch research projects');
  }
};

/**
 * Get single research project by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const researchProject = await prisma.researchProject.findUnique({
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
        outputs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!researchProject) {
      return errorResponse(res, 'Research project not found', 404);
    }

    return successResponse(
      res,
      researchProject,
      'Research project retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching research project:', error);
    return errorResponse(res, 'Failed to fetch research project');
  }
};

/**
 * Create new research project
 */
const create = async (req, res) => {
  try {
    const {
      lecturerId,
      academicPeriodId,
      title,
      theme,
      status,
      fundingSource,
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

    const researchProject = await prisma.researchProject.create({
      data: {
        lecturerId,
        academicPeriodId,
        title,
        theme,
        status: status || 'PLANNED',
        fundingSource,
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
      researchProject,
      'Research project created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating research project:', error);
    return errorResponse(res, 'Failed to create research project');
  }
};

/**
 * Update research project
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, theme, status, fundingSource } = req.body;

    const existing = await prisma.researchProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Research project not found', 404);
    }

    const researchProject = await prisma.researchProject.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(theme !== undefined && { theme }),
        ...(status && { status }),
        ...(fundingSource !== undefined && { fundingSource }),
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
      researchProject,
      'Research project updated successfully',
    );
  } catch (error) {
    console.error('Error updating research project:', error);
    return errorResponse(res, 'Failed to update research project');
  }
};

/**
 * Delete research project
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.researchProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Research project not found', 404);
    }

    await prisma.researchProject.delete({
      where: { id },
    });

    return successResponse(res, null, 'Research project deleted successfully');
  } catch (error) {
    console.error('Error deleting research project:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete research project with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete research project');
  }
};

/**
 * Get research projects by lecturer
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
      prisma.researchProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          academicPeriod: {
            include: { academicYear: true },
          },
          outputs: true,
          _count: {
            select: { outputs: true },
          },
        },
      }),
      prisma.researchProject.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer research projects retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer research projects:', error);
    return errorResponse(res, 'Failed to fetch lecturer research projects');
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
