const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all courses with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, studyProgramId } = req.query;

    const where = {
      ...(studyProgramId && { studyProgramId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          studyProgram: {
            include: {
              faculty: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          _count: {
            select: { offerings: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Courses retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching courses:', error);
    return errorResponse(res, 'Failed to fetch courses');
  }
};

/**
 * Get single course by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        studyProgram: {
          include: {
            faculty: {
              include: {
                institution: true,
              },
            },
          },
        },
        offerings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            academicPeriod: {
              include: { academicYear: true },
            },
            lecturer: {
              include: {
                user: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
        _count: {
          select: { offerings: true },
        },
      },
    });

    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    return successResponse(res, course, 'Course retrieved successfully');
  } catch (error) {
    console.error('Error fetching course:', error);
    return errorResponse(res, 'Failed to fetch course');
  }
};

/**
 * Create new course
 */
const create = async (req, res) => {
  try {
    const { studyProgramId, code, name, credits } = req.body;

    if (!studyProgramId || !code || !name || credits === undefined) {
      return errorResponse(
        res,
        'Study program ID, code, name, and credits are required',
        400,
      );
    }

    // Check if study program exists
    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id: studyProgramId },
    });

    if (!studyProgram) {
      return errorResponse(res, 'Study program not found', 404);
    }

    // Check if course code already exists in this study program
    const existing = await prisma.course.findUnique({
      where: {
        studyProgramId_code: { studyProgramId, code },
      },
    });

    if (existing) {
      return errorResponse(
        res,
        'Course code already exists in this study program',
        409,
      );
    }

    const course = await prisma.course.create({
      data: { studyProgramId, code, name, credits },
      include: {
        studyProgram: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(res, course, 'Course created successfully', 201);
  } catch (error) {
    console.error('Error creating course:', error);
    return errorResponse(res, 'Failed to create course');
  }
};

/**
 * Update course
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, credits } = req.body;

    const existing = await prisma.course.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Check if new code conflicts
    if (code && code !== existing.code) {
      const codeExists = await prisma.course.findUnique({
        where: {
          studyProgramId_code: {
            studyProgramId: existing.studyProgramId,
            code,
          },
        },
      });

      if (codeExists) {
        return errorResponse(
          res,
          'Course code already exists in this study program',
          409,
        );
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(credits !== undefined && { credits }),
      },
      include: {
        studyProgram: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(res, course, 'Course updated successfully');
  } catch (error) {
    console.error('Error updating course:', error);
    return errorResponse(res, 'Failed to update course');
  }
};

/**
 * Delete course
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Course not found', 404);
    }

    await prisma.course.delete({
      where: { id },
    });

    return successResponse(res, null, 'Course deleted successfully');
  } catch (error) {
    console.error('Error deleting course:', error);
    if (error.code === 'P2003') {
      return errorResponse(res, 'Cannot delete course with related data', 400);
    }
    return errorResponse(res, 'Failed to delete course');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
