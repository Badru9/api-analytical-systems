const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all study programs with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, facultyId } = req.query;

    const where = {
      ...(facultyId && { facultyId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.studyProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              code: true,
              institution: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          _count: {
            select: { lecturers: true, courses: true },
          },
        },
      }),
      prisma.studyProgram.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Study programs retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching study programs:', error);
    return errorResponse(res, 'Failed to fetch study programs');
  }
};

/**
 * Get single study program by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id },
      include: {
        faculty: {
          include: {
            institution: true,
          },
        },
        lecturers: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        courses: true,
        _count: {
          select: { lecturers: true, courses: true },
        },
      },
    });

    if (!studyProgram) {
      return errorResponse(res, 'Study program not found', 404);
    }

    return successResponse(
      res,
      studyProgram,
      'Study program retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching study program:', error);
    return errorResponse(res, 'Failed to fetch study program');
  }
};

/**
 * Create new study program
 */
const create = async (req, res) => {
  try {
    const { facultyId, name, code } = req.body;

    if (!facultyId || !name || !code) {
      return errorResponse(res, 'Faculty ID, name, and code are required', 400);
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty) {
      return errorResponse(res, 'Faculty not found', 404);
    }

    // Check if code already exists in this faculty
    const existing = await prisma.studyProgram.findUnique({
      where: {
        facultyId_code: { facultyId, code },
      },
    });

    if (existing) {
      return errorResponse(
        res,
        'Study program code already exists in this faculty',
        409,
      );
    }

    const studyProgram = await prisma.studyProgram.create({
      data: { facultyId, name, code },
      include: {
        faculty: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(
      res,
      studyProgram,
      'Study program created successfully',
      201,
    );
  } catch (error) {
    console.error('Error creating study program:', error);
    return errorResponse(res, 'Failed to create study program');
  }
};

/**
 * Update study program
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const existing = await prisma.studyProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Study program not found', 404);
    }

    // Check if new code conflicts
    if (code && code !== existing.code) {
      const codeExists = await prisma.studyProgram.findUnique({
        where: {
          facultyId_code: { facultyId: existing.facultyId, code },
        },
      });

      if (codeExists) {
        return errorResponse(
          res,
          'Study program code already exists in this faculty',
          409,
        );
      }
    }

    const studyProgram = await prisma.studyProgram.update({
      where: { id },
      data: { name, code },
      include: {
        faculty: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(
      res,
      studyProgram,
      'Study program updated successfully',
    );
  } catch (error) {
    console.error('Error updating study program:', error);
    return errorResponse(res, 'Failed to update study program');
  }
};

/**
 * Delete study program
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.studyProgram.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Study program not found', 404);
    }

    await prisma.studyProgram.delete({
      where: { id },
    });

    return successResponse(res, null, 'Study program deleted successfully');
  } catch (error) {
    console.error('Error deleting study program:', error);
    if (error.code === 'P2003') {
      return errorResponse(
        res,
        'Cannot delete study program with related data',
        400,
      );
    }
    return errorResponse(res, 'Failed to delete study program');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
