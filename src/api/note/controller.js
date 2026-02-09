const prisma = require('../../db/database');
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../utils/response');

/**
 * Get all notes with pagination
 */
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { academicPeriodId, lecturerId, role } = req.query;

    const where = {
      ...(academicPeriodId && { academicPeriodId }),
      ...(lecturerId && { lecturerId }),
      ...(role && { role }),
    };

    const [data, total] = await Promise.all([
      prisma.note.findMany({
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
          createdBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.note.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Notes retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching notes:', error);
    return errorResponse(res, 'Failed to fetch notes');
  }
};

/**
 * Get single note by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        lecturer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        academicPeriod: {
          include: { academicYear: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!note) {
      return errorResponse(res, 'Note not found', 404);
    }

    return successResponse(res, note, 'Note retrieved successfully');
  } catch (error) {
    console.error('Error fetching note:', error);
    return errorResponse(res, 'Failed to fetch note');
  }
};

/**
 * Create new note
 */
const create = async (req, res) => {
  try {
    const { academicPeriodId, lecturerId, role, noteText } = req.body;

    if (!academicPeriodId || !lecturerId || !role || !noteText) {
      return errorResponse(
        res,
        'Academic period ID, lecturer ID, role, and note text are required',
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

    const note = await prisma.note.create({
      data: {
        academicPeriodId,
        lecturerId,
        role,
        noteText,
        createdByUserId: req.user.id,
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
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, note, 'Note created successfully', 201);
  } catch (error) {
    console.error('Error creating note:', error);
    return errorResponse(res, 'Failed to create note');
  }
};

/**
 * Update note
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { noteText } = req.body;

    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Note not found', 404);
    }

    // Only creator can update
    if (
      existing.createdByUserId !== req.user.id &&
      !req.user.roles.includes('ADMIN')
    ) {
      return errorResponse(res, 'You can only update your own notes', 403);
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(noteText && { noteText }),
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
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    return successResponse(res, note, 'Note updated successfully');
  } catch (error) {
    console.error('Error updating note:', error);
    return errorResponse(res, 'Failed to update note');
  }
};

/**
 * Delete note
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse(res, 'Note not found', 404);
    }

    // Only creator or admin can delete
    if (
      existing.createdByUserId !== req.user.id &&
      !req.user.roles.includes('ADMIN')
    ) {
      return errorResponse(res, 'You can only delete your own notes', 403);
    }

    await prisma.note.delete({
      where: { id },
    });

    return successResponse(res, null, 'Note deleted successfully');
  } catch (error) {
    console.error('Error deleting note:', error);
    return errorResponse(res, 'Failed to delete note');
  }
};

/**
 * Get notes by lecturer
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
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          academicPeriod: {
            include: { academicYear: true },
          },
          createdBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.note.count({ where }),
    ]);

    return paginatedResponse(
      res,
      data,
      generatePaginationMeta(total, page, limit),
      'Lecturer notes retrieved successfully',
    );
  } catch (error) {
    console.error('Error fetching lecturer notes:', error);
    return errorResponse(res, 'Failed to fetch lecturer notes');
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
