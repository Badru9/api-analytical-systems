const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all research outputs with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { researchProjectId, type, status, targetIndex, search } = req.query;

    const where = {
      ...(researchProjectId && { researchProjectId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(targetIndex && { targetIndex }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.researchOutput.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          researchProject: {
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
          },
        },
      }),
      prisma.researchOutput.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Research outputs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching research outputs:', error);
    return errorResponse(res, 'Failed to fetch research outputs');
  }
};

/**
 * Get single research output by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const researchOutput = await prisma.researchOutput.findUnique({
      where: { id },
      include: {
        researchProject: {
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
          },
        },
      },
    });

    if (!researchOutput) {
      return errorResponse(res, 'Research output not found', 404);
    }

    return successResponse(
      res,
      researchOutput,
      'Research output retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching research output:', error);
    return errorResponse(res, 'Failed to fetch research output');
  }
};

/**
 * Create new research output
 */
const create = async (req, res) => {
  try {
    const {
      researchProjectId,
      type,
      title,
      targetIndex,
      status,
      doi,
      publishDate,
      citationCountYtd,
    } = req.body;

    if (!researchProjectId || !type || !title) {
      return errorResponse(
        res,
        'Research project ID, type, and title are required',
        400,
      );
    }

    // Validate research project exists
    const researchProject = await prisma.researchProject.findUnique({
      where: { id: researchProjectId },
    });
    if (!researchProject) {
      return errorResponse(res, 'Research project not found', 404);
    }

    const researchOutput = await prisma.researchOutput.create({
      data: {
        researchProjectId,
        type,
        title,
        targetIndex: targetIndex || 'NONE',
        status: status || 'DRAFT',
        doi,
        publishDate: publishDate ? new Date(publishDate) : null,
        citationCountYtd: citationCountYtd || 0,
      },
      include: {
        researchProject: {
          include: {
            lecturer: {
              include: {
                user: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      researchOutput,
      'Research output created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating research output:', error);
    return errorResponse(res, 'Failed to create research output');
  }
};

/**
 * Update research output
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      title,
      targetIndex,
      status,
      doi,
      publishDate,
      citationCountYtd,
    } = req.body;

    const existing = await prisma.researchOutput.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Research output not found', 404);
    }

    const researchOutput = await prisma.researchOutput.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(title && { title }),
        ...(targetIndex && { targetIndex }),
        ...(status && { status }),
        ...(doi !== undefined && { doi }),
        ...(publishDate !== undefined && {
          publishDate: publishDate ? new Date(publishDate) : null,
        }),
        ...(citationCountYtd !== undefined && { citationCountYtd }),
      },
      include: {
        researchProject: {
          include: {
            lecturer: {
              include: {
                user: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      researchOutput,
      'Research output updated successfully',
    );
  } catch (error) {
    console.error('Error updating research output:', error);
    return errorResponse(res, 'Failed to update research output');
  }
};

/**
 * Delete research output
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.researchOutput.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Research output not found', 404);
    }

    await prisma.researchOutput.delete({
      where: { id },
    });

    return successResponse(res, null, 'Research output deleted successfully');
  } catch (error) {
    console.error('Error deleting research output:', error);
    return errorResponse(res, 'Failed to delete research output');
  }
};

/**
 * Get outputs by research project
 */
const getByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const outputs = await prisma.researchOutput.findMany({
      where: { researchProjectId: projectId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(
      res,
      outputs,
      'Research outputs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching research outputs:', error);
    return errorResponse(res, 'Failed to fetch research outputs');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getByProject,
};
