const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all evidences with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      lecturerId,
      academicPeriodId,
      evidenceTypeId,
      verifiedStatus,
      search,
    } = req.query;

    const where = {
      ...(lecturerId && { lecturerId }),
      ...(academicPeriodId && { academicPeriodId }),
      ...(evidenceTypeId && { evidenceTypeId }),
      ...(verifiedStatus && { verifiedStatus }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.evidence.findMany({
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
          evidenceType: true,
          uploadedBy: {
            select: { id: true, fullName: true },
          },
          _count: {
            select: { links: true },
          },
        },
      }),
      prisma.evidence.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Evidences retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching evidences:', error);
    return errorResponse(res, 'Failed to fetch evidences');
  }
};

/**
 * Get single evidence by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await prisma.evidence.findUnique({
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
        evidenceType: true,
        uploadedBy: {
          select: { id: true, fullName: true },
        },
        links: true,
      },
    });

    if (!evidence) {
      return errorResponse(res, 'Evidence not found', 404);
    }

    return successResponse(res, evidence, 'Evidence retrieved successfully');
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return errorResponse(res, 'Failed to fetch evidence');
  }
};

/**
 * Create new evidence
 */
const create = async (req, res) => {
  try {
    const {
      lecturerId,
      academicPeriodId,
      evidenceTypeId,
      title,
      fileUrl,
      mimeType,
      issuedAt,
      verifiedStatus,
    } = req.body;

    if (!lecturerId || !academicPeriodId || !evidenceTypeId || !title) {
      return errorResponse(
        res,
        'Lecturer ID, academic period ID, evidence type ID, and title are required',
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

    // Validate evidence type exists
    const evidenceType = await prisma.evidenceType.findUnique({
      where: { id: evidenceTypeId },
    });
    if (!evidenceType) {
      return errorResponse(res, 'Evidence type not found', 404);
    }

    const evidence = await prisma.evidence.create({
      data: {
        lecturerId,
        academicPeriodId,
        evidenceTypeId,
        title,
        fileUrl,
        mimeType,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        verifiedStatus: verifiedStatus || 'DRAFT',
        uploadedByUserId: req.user.id,
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
        evidenceType: true,
        uploadedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, evidence, 'Evidence created successfully', 201);
  } catch (error) {
    console.error('Error creating evidence:', error);
    return errorResponse(res, 'Failed to create evidence');
  }
};

/**
 * Update evidence
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fileUrl, mimeType, issuedAt, verifiedStatus } = req.body;

    const existing = await prisma.evidence.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Evidence not found', 404);
    }

    const evidence = await prisma.evidence.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(mimeType !== undefined && { mimeType }),
        ...(issuedAt !== undefined && {
          issuedAt: issuedAt ? new Date(issuedAt) : null,
        }),
        ...(verifiedStatus && { verifiedStatus }),
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
        evidenceType: true,
        uploadedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, evidence, 'Evidence updated successfully');
  } catch (error) {
    console.error('Error updating evidence:', error);
    return errorResponse(res, 'Failed to update evidence');
  }
};

/**
 * Update evidence verification status
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifiedStatus } = req.body;

    if (!verifiedStatus) {
      return errorResponse(res, 'Verified status is required', 400);
    }

    const existing = await prisma.evidence.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Evidence not found', 404);
    }

    const evidence = await prisma.evidence.update({
      where: { id },
      data: { verifiedStatus },
      include: {
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
        evidenceType: true,
      },
    });

    return successResponse(
      res,
      evidence,
      'Evidence status updated successfully',
    );
  } catch (error) {
    console.error('Error updating evidence status:', error);
    return errorResponse(res, 'Failed to update evidence status');
  }
};

/**
 * Delete evidence
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.evidence.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Evidence not found', 404);
    }

    await prisma.evidence.delete({
      where: { id },
    });

    return successResponse(res, null, 'Evidence deleted successfully');
  } catch (error) {
    console.error('Error deleting evidence:', error);
    return errorResponse(res, 'Failed to delete evidence');
  }
};

/**
 * Get evidences by lecturer
 */
const getByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId, evidenceTypeId, verifiedStatus } = req.query;

    const where = {
      lecturerId,
      ...(academicPeriodId && { academicPeriodId }),
      ...(evidenceTypeId && { evidenceTypeId }),
      ...(verifiedStatus && { verifiedStatus }),
    };

    const [data, total] = await Promise.all([
      prisma.evidence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          academicPeriod: {
            include: { academicYear: true },
          },
          evidenceType: true,
          uploadedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.evidence.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer evidences retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer evidences:', error);
    return errorResponse(res, 'Failed to fetch lecturer evidences');
  }
};

/**
 * Add evidence link
 */
const addLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return errorResponse(res, 'Entity type and entity ID are required', 400);
    }

    // Validate evidence exists
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      return errorResponse(res, 'Evidence not found', 404);
    }

    const evidenceLink = await prisma.evidenceLink.create({
      data: {
        evidenceId: id,
        entityType,
        entityId,
      },
    });

    return successResponse(
      res,
      evidenceLink,
      'Evidence link created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating evidence link:', error);
    return errorResponse(res, 'Failed to create evidence link');
  }
};

/**
 * Remove evidence link
 */
const removeLink = async (req, res) => {
  try {
    const { id, linkId } = req.params;

    const existing = await prisma.evidenceLink.findFirst({
      where: { id: linkId, evidenceId: id },
    });

    if (!existing) {
      return errorResponse(res, 'Evidence link not found', 404);
    }

    await prisma.evidenceLink.delete({
      where: { id: linkId },
    });

    return successResponse(res, null, 'Evidence link deleted successfully');
  } catch (error) {
    console.error('Error deleting evidence link:', error);
    return errorResponse(res, 'Failed to delete evidence link');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove,
  getByLecturer,
  addLink,
  removeLink,
};
