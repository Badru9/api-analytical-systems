const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all reviews with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      academicPeriodId,
      lecturerId,
      reviewerUserId,
      reviewerRole,
      type,
      status,
      decision,
    } = req.query;

    const where = {
      ...(academicPeriodId && { academicPeriodId }),
      ...(lecturerId && { lecturerId }),
      ...(reviewerUserId && { reviewerUserId }),
      ...(reviewerRole && { reviewerRole }),
      ...(type && { type }),
      ...(status && { status }),
      ...(decision && { decision }),
    };

    const [data, total] = await Promise.all([
      prisma.review.findMany({
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
          reviewer: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Reviews retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return errorResponse(res, 'Failed to fetch reviews');
  }
};

/**
 * Get single review by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
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
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    return successResponse(res, review, 'Review retrieved successfully');
  } catch (error) {
    console.error('Error fetching review:', error);
    return errorResponse(res, 'Failed to fetch review');
  }
};

/**
 * Create new review
 */
const create = async (req, res) => {
  try {
    const { academicPeriodId, lecturerId, reviewerRole, type, summary } =
      req.body;

    if (!academicPeriodId || !lecturerId || !reviewerRole || !type) {
      return errorResponse(
        res,
        'Academic period ID, lecturer ID, reviewer role, and type are required',
        400,
      );
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

    const review = await prisma.review.create({
      data: {
        academicPeriodId,
        lecturerId,
        reviewerUserId: req.user.id,
        reviewerRole,
        type,
        status: 'OPEN',
        summary,
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
        reviewer: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, review, 'Review created successfully', 201);
  } catch (error) {
    console.error('Error creating review:', error);
    return errorResponse(res, 'Failed to create review');
  }
};

/**
 * Update review
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body;

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Review not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      return errorResponse(res, 'Cannot update completed review', 400);
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(summary !== undefined && { summary }),
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
        reviewer: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, review, 'Review updated successfully');
  } catch (error) {
    console.error('Error updating review:', error);
    return errorResponse(res, 'Failed to update review');
  }
};

/**
 * Complete review with decision
 */
const complete = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, summary } = req.body;

    if (!decision) {
      return errorResponse(res, 'Decision is required', 400);
    }

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Review not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      return errorResponse(res, 'Review already completed', 400);
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        decision,
        summary,
        status: 'COMPLETED',
        completedAt: new Date(),
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
        reviewer: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, review, 'Review completed successfully');
  } catch (error) {
    console.error('Error completing review:', error);
    return errorResponse(res, 'Failed to complete review');
  }
};

/**
 * Delete review
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Review not found', 404);
    }

    await prisma.review.delete({
      where: { id },
    });

    return successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    console.error('Error deleting review:', error);
    return errorResponse(res, 'Failed to delete review');
  }
};

/**
 * Get reviews by lecturer
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
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          academicPeriod: {
            include: { academicYear: true },
          },
          reviewer: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer reviews retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer reviews:', error);
    return errorResponse(res, 'Failed to fetch lecturer reviews');
  }
};

/**
 * Get reviews by reviewer
 */
const getByReviewer = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId, status } = req.query;

    const where = {
      reviewerUserId: req.user.id,
      ...(academicPeriodId && { academicPeriodId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.review.findMany({
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
        },
      }),
      prisma.review.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'My reviews retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    return errorResponse(res, 'Failed to fetch my reviews');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  complete,
  remove,
  getByLecturer,
  getByReviewer,
};
