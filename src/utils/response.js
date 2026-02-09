/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard error response
 */
const errorResponse = (
  res,
  message = 'Error',
  statusCode = 500,
  errors = null,
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Helper untuk parsing pagination parameters
 */
const parsePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Helper untuk generate pagination metadata
 */
const generatePaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
};
