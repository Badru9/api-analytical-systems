const test = require('node:test');
const assert = require('node:assert/strict');

const {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generatePaginationMeta,
} = require('../../src/utils/response');

/**
 * Mock response object untuk testing
 */
function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

// ==================== successResponse tests ====================
test('successResponse - returns correct structure with default values', (t) => {
  const res = createMockRes();
  const data = { id: 1, name: 'Test' };

  successResponse(res, data);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    message: 'Success',
    data: { id: 1, name: 'Test' },
  });
});

test('successResponse - uses custom message and status code', (t) => {
  const res = createMockRes();
  const data = { id: 1 };

  successResponse(res, data, 'Created successfully', 201);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Created successfully');
  assert.equal(res.body.success, true);
});

test('successResponse - handles null data', (t) => {
  const res = createMockRes();

  successResponse(res, null);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data, null);
});

test('successResponse - handles array data', (t) => {
  const res = createMockRes();
  const data = [{ id: 1 }, { id: 2 }];

  successResponse(res, data);

  assert.deepEqual(res.body.data, [{ id: 1 }, { id: 2 }]);
});

// ==================== errorResponse tests ====================
test('errorResponse - returns correct structure with default values', (t) => {
  const res = createMockRes();

  errorResponse(res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: 'Error',
  });
});

test('errorResponse - uses custom message and status code', (t) => {
  const res = createMockRes();

  errorResponse(res, 'Not found', 404);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Not found');
  assert.equal(res.body.success, false);
});

test('errorResponse - includes errors when provided', (t) => {
  const res = createMockRes();
  const errors = [{ field: 'email', message: 'Invalid email format' }];

  errorResponse(res, 'Validation failed', 400, errors);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.errors, errors);
});

test('errorResponse - does not include errors key when null', (t) => {
  const res = createMockRes();

  errorResponse(res, 'Server error', 500, null);

  assert.equal(res.body.errors, undefined);
});

// ==================== paginatedResponse tests ====================
test('paginatedResponse - returns correct structure', (t) => {
  const res = createMockRes();
  const data = [{ id: 1 }, { id: 2 }];
  const pagination = { total: 100, page: 1, limit: 10, totalPages: 10 };

  paginatedResponse(res, data, pagination);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    message: 'Success',
    data,
    pagination,
  });
});

test('paginatedResponse - uses custom message', (t) => {
  const res = createMockRes();

  paginatedResponse(res, [], {}, 'Data fetched');

  assert.equal(res.body.message, 'Data fetched');
});

// ==================== parsePagination tests ====================
test('parsePagination - returns defaults when no query params', (t) => {
  const result = parsePagination({});

  assert.deepEqual(result, { page: 1, limit: 10, skip: 0 });
});

test('parsePagination - parses valid page and limit', (t) => {
  const result = parsePagination({ page: '3', limit: '20' });

  assert.deepEqual(result, { page: 3, limit: 20, skip: 40 });
});

test('parsePagination - handles invalid values with defaults', (t) => {
  const result = parsePagination({ page: 'abc', limit: 'xyz' });

  assert.deepEqual(result, { page: 1, limit: 10, skip: 0 });
});

test('parsePagination - calculates skip correctly for page 1', (t) => {
  const result = parsePagination({ page: '1', limit: '25' });

  assert.equal(result.skip, 0);
});

test('parsePagination - calculates skip correctly for page 5', (t) => {
  const result = parsePagination({ page: '5', limit: '15' });

  assert.equal(result.skip, 60); // (5-1) * 15 = 60
});

// ==================== generatePaginationMeta tests ====================
test('generatePaginationMeta - returns correct metadata', (t) => {
  const result = generatePaginationMeta(100, 1, 10);

  assert.deepEqual(result, {
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10,
    hasNext: true,
    hasPrev: false,
  });
});

test('generatePaginationMeta - hasNext is false on last page', (t) => {
  const result = generatePaginationMeta(100, 10, 10);

  assert.equal(result.hasNext, false);
  assert.equal(result.hasPrev, true);
});

test('generatePaginationMeta - both hasNext and hasPrev true on middle page', (t) => {
  const result = generatePaginationMeta(100, 5, 10);

  assert.equal(result.hasNext, true);
  assert.equal(result.hasPrev, true);
});

test('generatePaginationMeta - handles single page', (t) => {
  const result = generatePaginationMeta(5, 1, 10);

  assert.deepEqual(result, {
    total: 5,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
});

test('generatePaginationMeta - handles empty result', (t) => {
  const result = generatePaginationMeta(0, 1, 10);

  assert.equal(result.total, 0);
  assert.equal(result.totalPages, 0);
  assert.equal(result.hasNext, false);
  assert.equal(result.hasPrev, false);
});

test('generatePaginationMeta - calculates totalPages correctly with remainder', (t) => {
  const result = generatePaginationMeta(25, 1, 10);

  assert.equal(result.totalPages, 3); // Math.ceil(25/10) = 3
});
