const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all lecturers with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, studyProgramId, facultyId } = req.query;

    const where = {
      ...(studyProgramId && { studyProgramId }),
      ...(facultyId && {
        studyProgram: { facultyId },
      }),
      ...(search && {
        OR: [
          { nidn: { contains: search, mode: 'insensitive' } },
          { user: { fullName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.lecturer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { fullName: 'asc' } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              isActive: true,
              roles: {
                include: { role: true },
              },
            },
          },
          studyProgram: {
            include: {
              faculty: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          _count: {
            select: {
              offerings: true,
              researchProjects: true,
              servicePrograms: true,
            },
          },
        },
      }),
      prisma.lecturer.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturers retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturers:', error);
    return errorResponse(res, 'Failed to fetch lecturers');
  }
};

/**
 * Get single lecturer by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            roles: {
              include: { role: true },
            },
          },
        },
        studyProgram: {
          include: {
            faculty: {
              include: {
                institution: true,
              },
            },
          },
        },
        _count: {
          select: {
            offerings: true,
            coOfferings: true,
            researchProjects: true,
            servicePrograms: true,
            evidences: true,
            reviews: true,
            kpiSnapshots: true,
          },
        },
      },
    });

    if (!lecturer) {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    return successResponse(res, lecturer, 'Lecturer retrieved successfully');
  } catch (error) {
    console.error('Error fetching lecturer:', error);
    return errorResponse(res, 'Failed to fetch lecturer');
  }
};

/**
 * Create new lecturer
 */
const create = async (req, res) => {
  try {
    const { userId, studyProgramId, nidn, academicRank, expertiseFocus } =
      req.body;

    if (!userId || !studyProgramId || !nidn) {
      return errorResponse(
        res,
        'User ID, Study Program ID, and NIDN are required',
        400,
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if user already has lecturer profile
    const existingLecturer = await prisma.lecturer.findUnique({
      where: { userId },
    });
    if (existingLecturer) {
      return errorResponse(res, 'User already has a lecturer profile', 409);
    }

    // Check if study program exists
    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id: studyProgramId },
    });
    if (!studyProgram) {
      return errorResponse(res, 'Study program not found', 404);
    }

    // Check if NIDN already exists
    const nidnExists = await prisma.lecturer.findUnique({
      where: { nidn },
    });
    if (nidnExists) {
      return errorResponse(res, 'NIDN already registered', 409);
    }

    const lecturer = await prisma.lecturer.create({
      data: {
        userId,
        studyProgramId,
        nidn,
        academicRank,
        expertiseFocus,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        studyProgram: {
          include: {
            faculty: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    return successResponse(res, lecturer, 'Lecturer created successfully', 201);
  } catch (error) {
    console.error('Error creating lecturer:', error);
    return errorResponse(res, 'Failed to create lecturer');
  }
};

/**
 * Update lecturer
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { studyProgramId, nidn, academicRank, expertiseFocus } = req.body;

    const existing = await prisma.lecturer.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    // Check if new study program exists
    if (studyProgramId) {
      const studyProgram = await prisma.studyProgram.findUnique({
        where: { id: studyProgramId },
      });
      if (!studyProgram) {
        return errorResponse(res, 'Study program not found', 404);
      }
    }

    // Check if new NIDN conflicts
    if (nidn && nidn !== existing.nidn) {
      const nidnExists = await prisma.lecturer.findUnique({
        where: { nidn },
      });
      if (nidnExists) {
        return errorResponse(res, 'NIDN already registered', 409);
      }
    }

    const lecturer = await prisma.lecturer.update({
      where: { id },
      data: {
        ...(studyProgramId && { studyProgramId }),
        ...(nidn && { nidn }),
        ...(academicRank !== undefined && { academicRank }),
        ...(expertiseFocus !== undefined && { expertiseFocus }),
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        studyProgram: {
          include: {
            faculty: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    return successResponse(res, lecturer, 'Lecturer updated successfully');
  } catch (error) {
    console.error('Error updating lecturer:', error);
    return errorResponse(res, 'Failed to update lecturer');
  }
};

/**
 * Delete lecturer
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.lecturer.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    await prisma.lecturer.delete({
      where: { id },
    });

    return successResponse(res, null, 'Lecturer deleted successfully');
  } catch (error) {
    console.error('Error deleting lecturer:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete lecturer with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete lecturer');
  }
};

/**
 * Get lecturer dashboard summary
 */
const getDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        studyProgram: {
          include: {
            faculty: true,
          },
        },
        offerings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            course: true,
            academicPeriod: {
              include: { academicYear: true },
            },
          },
        },
        researchProjects: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        servicePrograms: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        kpiSnapshots: {
          take: 1,
          orderBy: { calculatedAt: 'desc' },
        },
        _count: {
          select: {
            offerings: true,
            coOfferings: true,
            researchProjects: true,
            servicePrograms: true,
            evidences: true,
          },
        },
      },
    });

    if (!lecturer) {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    return successResponse(
      res,
      lecturer,
      'Lecturer dashboard retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer dashboard:', error);
    return errorResponse(res, 'Failed to fetch lecturer dashboard');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getDashboard,
};
