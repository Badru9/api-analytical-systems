const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all audit logs with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { actorUserId, entityType, entityId, action } = req.query;

    const where = {
      ...(actorUserId && { actorUserId }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(action && { action }),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Audit logs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return errorResponse(res, 'Failed to fetch audit logs');
  }
};

/**
 * Get single audit log by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!auditLog) {
      return errorResponse(res, 'Audit log not found', 404);
    }

    return successResponse(res, auditLog, 'Audit log retrieved successfully');
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return errorResponse(res, 'Failed to fetch audit log');
  }
};

/**
 * Create new audit log (internal use)
 */
const create = async (req, res) => {
  try {
    const { entityType, entityId, action, before, after } = req.body;

    if (!entityType || !entityId || !action) {
      return errorResponse(
        res,
        'Entity type, entity ID, and action are required',
        400,
      );
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        actorUserId: req.user.id,
        entityType,
        entityId,
        action,
        before,
        after,
      },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return successResponse(
      res,
      auditLog,
      'Audit log created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
    return errorResponse(res, 'Failed to create audit log');
  }
};

/**
 * Get audit logs by entity
 */
const getByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {
      entityType,
      entityId,
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Entity audit logs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    return errorResponse(res, 'Failed to fetch entity audit logs');
  }
};

/**
 * Get audit logs by user
 */
const getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {
      actorUserId: userId,
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'User audit logs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return errorResponse(res, 'Failed to fetch user audit logs');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  getByEntity,
  getByUser,
};
