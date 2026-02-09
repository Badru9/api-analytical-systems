const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all KPI snapshots with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId, lecturerId } = req.query;

    const where = {
      ...(academicPeriodId && { academicPeriodId }),
      ...(lecturerId && { lecturerId }),
    };

    const [data, total] = await Promise.all([
      prisma.kpiSnapshot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { calculatedAt: 'desc' },
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
          calculatedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.kpiSnapshot.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'KPI snapshots retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching KPI snapshots:', error);
    return errorResponse(res, 'Failed to fetch KPI snapshots');
  }
};

/**
 * Get single KPI snapshot by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const kpiSnapshot = await prisma.kpiSnapshot.findUnique({
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
        calculatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!kpiSnapshot) {
      return errorResponse(res, 'KPI snapshot not found', 404);
    }

    return successResponse(
      res,
      kpiSnapshot,
      'KPI snapshot retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching KPI snapshot:', error);
    return errorResponse(res, 'Failed to fetch KPI snapshot');
  }
};

/**
 * Create new KPI snapshot
 */
const create = async (req, res) => {
  try {
    const {
      academicPeriodId,
      lecturerId,
      teachingScore,
      researchScore,
      serviceScore,
      supportScore,
      tridharmaIndex,
      evidenceScore,
      bkdComplianceScore,
      riskScore,
    } = req.body;

    if (!academicPeriodId || !lecturerId) {
      return errorResponse(
        res,
        'Academic period ID and lecturer ID are required',
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

    const kpiSnapshot = await prisma.kpiSnapshot.create({
      data: {
        academicPeriodId,
        lecturerId,
        teachingScore,
        researchScore,
        serviceScore,
        supportScore,
        tridharmaIndex,
        evidenceScore,
        bkdComplianceScore,
        riskScore: riskScore || 0,
        calculatedByUserId: req.user.id,
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
        calculatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(
      res,
      kpiSnapshot,
      'KPI snapshot created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating KPI snapshot:', error);
    return errorResponse(res, 'Failed to create KPI snapshot');
  }
};

/**
 * Update KPI snapshot
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      teachingScore,
      researchScore,
      serviceScore,
      supportScore,
      tridharmaIndex,
      evidenceScore,
      bkdComplianceScore,
      riskScore,
    } = req.body;

    const existing = await prisma.kpiSnapshot.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'KPI snapshot not found', 404);
    }

    const kpiSnapshot = await prisma.kpiSnapshot.update({
      where: { id },
      data: {
        ...(teachingScore !== undefined && { teachingScore }),
        ...(researchScore !== undefined && { researchScore }),
        ...(serviceScore !== undefined && { serviceScore }),
        ...(supportScore !== undefined && { supportScore }),
        ...(tridharmaIndex !== undefined && { tridharmaIndex }),
        ...(evidenceScore !== undefined && { evidenceScore }),
        ...(bkdComplianceScore !== undefined && { bkdComplianceScore }),
        ...(riskScore !== undefined && { riskScore }),
        calculatedAt: new Date(),
        calculatedByUserId: req.user.id,
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
        calculatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(
      res,
      kpiSnapshot,
      'KPI snapshot updated successfully',
    );
  } catch (error) {
    console.error('Error updating KPI snapshot:', error);
    return errorResponse(res, 'Failed to update KPI snapshot');
  }
};

/**
 * Delete KPI snapshot
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.kpiSnapshot.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'KPI snapshot not found', 404);
    }

    await prisma.kpiSnapshot.delete({
      where: { id },
    });

    return successResponse(res, null, 'KPI snapshot deleted successfully');
  } catch (error) {
    console.error('Error deleting KPI snapshot:', error);
    return errorResponse(res, 'Failed to delete KPI snapshot');
  }
};

/**
 * Get KPI snapshots by lecturer
 */
const getByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId } = req.query;

    const where = {
      lecturerId,
      ...(academicPeriodId && { academicPeriodId }),
    };

    const [data, total] = await Promise.all([
      prisma.kpiSnapshot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { calculatedAt: 'desc' },
        include: {
          academicPeriod: {
            include: { academicYear: true },
          },
          calculatedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.kpiSnapshot.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer KPI snapshots retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer KPI snapshots:', error);
    return errorResponse(res, 'Failed to fetch lecturer KPI snapshots');
  }
};

/**
 * Get latest KPI snapshot for lecturer
 */
const getLatestByLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const kpiSnapshot = await prisma.kpiSnapshot.findFirst({
      where: { lecturerId },
      orderBy: { calculatedAt: 'desc' },
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
        calculatedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!kpiSnapshot) {
      return errorResponse(res, 'No KPI snapshot found for this lecturer', 404);
    }

    return successResponse(
      res,
      kpiSnapshot,
      'Latest KPI snapshot retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching latest KPI snapshot:', error);
    return errorResponse(res, 'Failed to fetch latest KPI snapshot');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getByLecturer,
  getLatestByLecturer,
};
