const prisma = require('../../db/database');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Get service impact by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceImpact = await prisma.serviceImpact.findUnique({
      where: { id },
      include: {
        serviceProgram: {
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
    });

    if (!serviceImpact) {
      return errorResponse(res, 'Service impact not found', 404);
    }

    return successResponse(
      res,
      serviceImpact,
      'Service impact retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching service impact:', error);
    return errorResponse(res, 'Failed to fetch service impact');
  }
};

/**
 * Get service impact by service program ID
 */
const getByServiceProgram = async (req, res) => {
  try {
    const { serviceProgramId } = req.params;

    const serviceImpact = await prisma.serviceImpact.findUnique({
      where: { serviceProgramId },
      include: {
        serviceProgram: true,
      },
    });

    if (!serviceImpact) {
      return errorResponse(res, 'Service impact not found', 404);
    }

    return successResponse(
      res,
      serviceImpact,
      'Service impact retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching service impact:', error);
    return errorResponse(res, 'Failed to fetch service impact');
  }
};

/**
 * Create or update service impact for a service program
 */
const upsert = async (req, res) => {
  try {
    const { serviceProgramId } = req.params;
    const { impactScore, baselineValue, endlineValue, outcomeSummary } =
      req.body;

    // Validate service program exists
    const serviceProgram = await prisma.serviceProgram.findUnique({
      where: { id: serviceProgramId },
    });

    if (!serviceProgram) {
      return errorResponse(res, 'Service program not found', 404);
    }

    const serviceImpact = await prisma.serviceImpact.upsert({
      where: { serviceProgramId },
      update: {
        ...(impactScore !== undefined && { impactScore }),
        ...(baselineValue !== undefined && { baselineValue }),
        ...(endlineValue !== undefined && { endlineValue }),
        ...(outcomeSummary !== undefined && { outcomeSummary }),
      },
      create: {
        serviceProgramId,
        impactScore,
        baselineValue,
        endlineValue,
        outcomeSummary,
      },
      include: {
        serviceProgram: {
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
      serviceImpact,
      'Service impact saved successfully',
    );
  } catch (error) {
    console.error('Error saving service impact:', error);
    return errorResponse(res, 'Failed to save service impact');
  }
};

/**
 * Update service impact
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { impactScore, baselineValue, endlineValue, outcomeSummary } =
      req.body;

    const existing = await prisma.serviceImpact.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Service impact not found', 404);
    }

    const serviceImpact = await prisma.serviceImpact.update({
      where: { id },
      data: {
        ...(impactScore !== undefined && { impactScore }),
        ...(baselineValue !== undefined && { baselineValue }),
        ...(endlineValue !== undefined && { endlineValue }),
        ...(outcomeSummary !== undefined && { outcomeSummary }),
      },
      include: {
        serviceProgram: true,
      },
    });

    return successResponse(
      res,
      serviceImpact,
      'Service impact updated successfully',
    );
  } catch (error) {
    console.error('Error updating service impact:', error);
    return errorResponse(res, 'Failed to update service impact');
  }
};

/**
 * Delete service impact
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.serviceImpact.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Service impact not found', 404);
    }

    await prisma.serviceImpact.delete({
      where: { id },
    });

    return successResponse(res, null, 'Service impact deleted successfully');
  } catch (error) {
    console.error('Error deleting service impact:', error);
    return errorResponse(res, 'Failed to delete service impact');
  }
};

module.exports = {
  getById,
  getByServiceProgram,
  upsert,
  update,
  remove,
};
