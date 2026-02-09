const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all course offerings with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { courseId, academicPeriodId, lecturerId } = req.query;

    const where = {
      ...(courseId && { courseId }),
      ...(academicPeriodId && { academicPeriodId }),
      ...(lecturerId && { lecturerId }),
    };

    const [data, total] = await Promise.all([
      prisma.courseOffering.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            include: {
              studyProgram: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          academicPeriod: {
            include: { academicYear: true },
          },
          lecturer: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          coLecturer: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          teachingActivity: true,
        },
      }),
      prisma.courseOffering.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Course offerings retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return errorResponse(res, 'Failed to fetch course offerings');
  }
};

/**
 * Get single course offering by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            studyProgram: {
              include: {
                faculty: true,
              },
            },
          },
        },
        academicPeriod: {
          include: { academicYear: true },
        },
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        coLecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        teachingActivity: true,
      },
    });

    if (!courseOffering) {
      return errorResponse(res, 'Course offering not found', 404);
    }

    return successResponse(
      res,
      courseOffering,
      'Course offering retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching course offering:', error);
    return errorResponse(res, 'Failed to fetch course offering');
  }
};

/**
 * Create new course offering
 */
const create = async (req, res) => {
  try {
    const {
      courseId,
      academicPeriodId,
      className,
      lecturerId,
      coLecturerId,
      studentCount,
    } = req.body;

    if (!courseId || !academicPeriodId || !className || !lecturerId) {
      return errorResponse(
        res,
        'Course ID, academic period ID, class name, and lecturer ID are required',
        400,
      );
    }

    // Validate course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Validate academic period exists
    const academicPeriod = await prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });
    if (!academicPeriod) {
      return errorResponse(res, 'Academic period not found', 404);
    }

    // Validate lecturer exists
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
    });
    if (!lecturer) {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    // Validate co-lecturer if provided
    if (coLecturerId) {
      const coLecturer = await prisma.lecturer.findUnique({
        where: { id: coLecturerId },
      });
      if (!coLecturer) {
        return errorResponse(res, 'Co-lecturer not found', 404);
      }
    }

    // Check for duplicate offering
    const existing = await prisma.courseOffering.findUnique({
      where: {
        courseId_academicPeriodId_className_lecturerId: {
          courseId,
          academicPeriodId,
          className,
          lecturerId,
        },
      },
    });

    if (existing) {
      return errorResponse(res, 'Course offering already exists', 409);
    }

    const courseOffering = await prisma.courseOffering.create({
      data: {
        courseId,
        academicPeriodId,
        className,
        lecturerId,
        coLecturerId,
        studentCount,
      },
      include: {
        course: true,
        academicPeriod: {
          include: { academicYear: true },
        },
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        coLecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      courseOffering,
      'Course offering created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating course offering:', error);
    return errorResponse(res, 'Failed to create course offering');
  }
};

/**
 * Update course offering
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, coLecturerId, studentCount } = req.body;

    const existing = await prisma.courseOffering.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Course offering not found', 404);
    }

    // Validate co-lecturer if provided
    if (coLecturerId) {
      const coLecturer = await prisma.lecturer.findUnique({
        where: { id: coLecturerId },
      });
      if (!coLecturer) {
        return errorResponse(res, 'Co-lecturer not found', 404);
      }
    }

    const courseOffering = await prisma.courseOffering.update({
      where: { id },
      data: {
        ...(className && { className }),
        ...(coLecturerId !== undefined && { coLecturerId }),
        ...(studentCount !== undefined && { studentCount }),
      },
      include: {
        course: true,
        academicPeriod: {
          include: { academicYear: true },
        },
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        coLecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      courseOffering,
      'Course offering updated successfully',
    );
  } catch (error) {
    console.error('Error updating course offering:', error);
    return errorResponse(res, 'Failed to update course offering');
  }
};

/**
 * Delete course offering
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.courseOffering.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Course offering not found', 404);
    }

    await prisma.courseOffering.delete({
      where: { id },
    });

    return successResponse(res, null, 'Course offering deleted successfully');
  } catch (error) {
    console.error('Error deleting course offering:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete course offering with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete course offering');
  }
};

/**
 * Get offerings by lecturer
 */
const getByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId } = req.query;

    const where = {
      OR: [{ lecturerId }, { coLecturerId: lecturerId }],
      ...(academicPeriodId && { academicPeriodId }),
    };

    const [data, total] = await Promise.all([
      prisma.courseOffering.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: true,
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
          coLecturer: {
            include: {
              user: {
                select: { fullName: true },
              },
            },
          },
          teachingActivity: true,
        },
      }),
      prisma.courseOffering.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer offerings retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer offerings:', error);
    return errorResponse(res, 'Failed to fetch lecturer offerings');
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
