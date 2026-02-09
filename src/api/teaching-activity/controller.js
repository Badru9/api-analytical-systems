const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all teaching activities with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { lecturerId, academicPeriodId, rpsStatus } = req.query;

    const where = {
      ...(rpsStatus && { rpsStatus }),
      courseOffering: {
        ...(lecturerId && { lecturerId }),
        ...(academicPeriodId && { academicPeriodId }),
      },
    };

    const [data, total] = await Promise.all([
      prisma.teachingActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          courseOffering: {
            include: {
              course: true,
              academicPeriod: {
                include: { academicYear: true },
              },
              lecturer: {
                include: {
                  user: {
                    select: { id: true, fullName: true },
                  },
                },
              },
            },
          },
          updatedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.teachingActivity.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Teaching activities retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching teaching activities:', error);
    return errorResponse(res, 'Failed to fetch teaching activities');
  }
};

/**
 * Get single teaching activity by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const teachingActivity = await prisma.teachingActivity.findUnique({
      where: { id },
      include: {
        courseOffering: {
          include: {
            course: {
              include: {
                studyProgram: true,
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
          },
        },
        updatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!teachingActivity) {
      return errorResponse(res, 'Teaching activity not found', 404);
    }

    return successResponse(
      res,
      teachingActivity,
      'Teaching activity retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching teaching activity:', error);
    return errorResponse(res, 'Failed to fetch teaching activity');
  }
};

/**
 * Get teaching activity by course offering ID
 */
const getByCourseOffering = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;

    const teachingActivity = await prisma.teachingActivity.findUnique({
      where: { courseOfferingId },
      include: {
        courseOffering: {
          include: {
            course: true,
            academicPeriod: {
              include: { academicYear: true },
            },
            lecturer: {
              include: {
                user: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
        updatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!teachingActivity) {
      return errorResponse(res, 'Teaching activity not found', 404);
    }

    return successResponse(
      res,
      teachingActivity,
      'Teaching activity retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching teaching activity:', error);
    return errorResponse(res, 'Failed to fetch teaching activity');
  }
};

/**
 * Create or update teaching activity for a course offering
 */
const upsert = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const {
      rpsStatus,
      lmsHealthScore,
      assessmentOntimeScore,
      progressScore,
      studentFeedbackScore,
      attendanceRate,
    } = req.body;

    // Validate course offering exists
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
    });

    if (!courseOffering) {
      return errorResponse(res, 'Course offering not found', 404);
    }

    const teachingActivity = await prisma.teachingActivity.upsert({
      where: { courseOfferingId },
      update: {
        ...(rpsStatus && { rpsStatus }),
        ...(lmsHealthScore !== undefined && { lmsHealthScore }),
        ...(assessmentOntimeScore !== undefined && { assessmentOntimeScore }),
        ...(progressScore !== undefined && { progressScore }),
        ...(studentFeedbackScore !== undefined && { studentFeedbackScore }),
        ...(attendanceRate !== undefined && { attendanceRate }),
        updatedByUserId: req.user.id,
      },
      create: {
        courseOfferingId,
        rpsStatus: rpsStatus || 'DRAFT',
        lmsHealthScore,
        assessmentOntimeScore,
        progressScore,
        studentFeedbackScore,
        attendanceRate,
        updatedByUserId: req.user.id,
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            academicPeriod: {
              include: { academicYear: true },
            },
          },
        },
        updatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(
      res,
      teachingActivity,
      'Teaching activity saved successfully',
    );
  } catch (error) {
    console.error('Error saving teaching activity:', error);
    return errorResponse(res, 'Failed to save teaching activity');
  }
};

/**
 * Update teaching activity
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rpsStatus,
      lmsHealthScore,
      assessmentOntimeScore,
      progressScore,
      studentFeedbackScore,
      attendanceRate,
    } = req.body;

    const existing = await prisma.teachingActivity.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Teaching activity not found', 404);
    }

    const teachingActivity = await prisma.teachingActivity.update({
      where: { id },
      data: {
        ...(rpsStatus && { rpsStatus }),
        ...(lmsHealthScore !== undefined && { lmsHealthScore }),
        ...(assessmentOntimeScore !== undefined && { assessmentOntimeScore }),
        ...(progressScore !== undefined && { progressScore }),
        ...(studentFeedbackScore !== undefined && { studentFeedbackScore }),
        ...(attendanceRate !== undefined && { attendanceRate }),
        updatedByUserId: req.user.id,
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            academicPeriod: {
              include: { academicYear: true },
            },
          },
        },
        updatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(
      res,
      teachingActivity,
      'Teaching activity updated successfully',
    );
  } catch (error) {
    console.error('Error updating teaching activity:', error);
    return errorResponse(res, 'Failed to update teaching activity');
  }
};

/**
 * Delete teaching activity
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.teachingActivity.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Teaching activity not found', 404);
    }

    await prisma.teachingActivity.delete({
      where: { id },
    });

    return successResponse(res, null, 'Teaching activity deleted successfully');
  } catch (error) {
    console.error('Error deleting teaching activity:', error);
    return errorResponse(res, 'Failed to delete teaching activity');
  }
};

module.exports = {
  getAll,
  getById,
  getByCourseOffering,
  upsert,
  update,
  remove,
};
