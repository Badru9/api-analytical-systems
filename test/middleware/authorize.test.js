const test = require('node:test');
const assert = require('node:assert/strict');

const {
  authorize,
  authorizeOwnerOrRoles,
} = require('../../src/middleware/authorize');

/**
 * Mock request object
 */
function createMockReq(user = null, params = {}, body = {}) {
  return {
    user,
    params,
    body,
  };
}

/**
 * Mock response object
 */
function createMockRes() {
  return {
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
}

// ==================== authorize middleware tests ====================
test('authorize - returns 401 when user is not authenticated', (t) => {
  const middleware = authorize('DOSEN');
  const req = createMockReq(null);
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Authentication required');
  assert.equal(nextCalled, false);
});

test('authorize - ADMIN can access any route', (t) => {
  const middleware = authorize('DOSEN', 'KAPRODI');
  const req = createMockReq({ roles: ['ADMIN'] });
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('authorize - allows user with matching role', (t) => {
  const middleware = authorize('DOSEN', 'KAPRODI');
  const req = createMockReq({ roles: ['DOSEN'] });
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorize - allows user with one of multiple allowed roles', (t) => {
  const middleware = authorize('LPPM', 'LPM', 'DEKAN');
  const req = createMockReq({ roles: ['LPM'] });
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorize - denies user without matching role', (t) => {
  const middleware = authorize('KAPRODI', 'DEKAN');
  const req = createMockReq({ roles: ['DOSEN'] });
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Access denied. Insufficient permissions.');
  assert.equal(nextCalled, false);
});

test('authorize - handles user with multiple roles', (t) => {
  const middleware = authorize('DEKAN');
  const req = createMockReq({ roles: ['DOSEN', 'KAPRODI', 'DEKAN'] });
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorize - denies when user has no roles', (t) => {
  const middleware = authorize('DOSEN');
  const req = createMockReq({ roles: [] });
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

// ==================== authorizeOwnerOrRoles middleware tests ====================
test('authorizeOwnerOrRoles - returns 401 when user is not authenticated', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI');
  const req = createMockReq(null);
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Authentication required');
  assert.equal(nextCalled, false);
});

test('authorizeOwnerOrRoles - ADMIN can access any resource', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI');
  const req = createMockReq(
    { roles: ['ADMIN'], lecturerId: 'lec-1' },
    { lecturerId: 'lec-999' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorizeOwnerOrRoles - owner can access their own resource via params', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI');
  const req = createMockReq(
    { roles: ['DOSEN'], lecturerId: 'lec-123' },
    { lecturerId: 'lec-123' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorizeOwnerOrRoles - owner can access their own resource via body', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI');
  const req = createMockReq(
    { roles: ['DOSEN'], lecturerId: 'lec-456' },
    {},
    { lecturerId: 'lec-456' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorizeOwnerOrRoles - user with allowed role can access others resource', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI', 'DEKAN');
  const req = createMockReq(
    { roles: ['KAPRODI'], lecturerId: 'lec-1' },
    { lecturerId: 'lec-999' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorizeOwnerOrRoles - denies non-owner without allowed role', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI', 'DEKAN');
  const req = createMockReq(
    { roles: ['DOSEN'], lecturerId: 'lec-1' },
    { lecturerId: 'lec-999' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(
    res.body.message,
    'Access denied. You can only access your own data.',
  );
  assert.equal(nextCalled, false);
});

test('authorizeOwnerOrRoles - denies when user has no lecturerId', (t) => {
  const middleware = authorizeOwnerOrRoles('KAPRODI');
  const req = createMockReq(
    { roles: ['DOSEN'], lecturerId: null },
    { lecturerId: 'lec-999' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('authorizeOwnerOrRoles - params.lecturerId takes precedence over body', (t) => {
  const middleware = authorizeOwnerOrRoles();
  const req = createMockReq(
    { roles: ['DOSEN'], lecturerId: 'lec-123' },
    { lecturerId: 'lec-123' },
    { lecturerId: 'lec-456' },
  );
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  // params.lecturerId (lec-123) matches user.lecturerId (lec-123)
  assert.equal(nextCalled, true);
});
