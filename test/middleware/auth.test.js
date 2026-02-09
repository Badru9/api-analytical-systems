const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { generateToken, JWT_SECRET } = require('../../src/middleware/auth');

// ==================== generateToken tests ====================
test('generateToken - returns a valid JWT string', (t) => {
  const token = generateToken('user-123');

  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3, 'Token should have 3 parts');
});

test('generateToken - token contains correct userId', (t) => {
  const userId = 'user-456';
  const token = generateToken(userId);

  const decoded = jwt.verify(token, JWT_SECRET);

  assert.equal(decoded.userId, userId);
});

test('generateToken - uses default expiration of 7d', (t) => {
  const token = generateToken('user-789');
  const decoded = jwt.decode(token);

  // Calculate expected expiration (7 days from now)
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;

  // Allow 10 second tolerance
  assert.ok(decoded.exp - decoded.iat >= sevenDaysInSeconds - 10);
  assert.ok(decoded.exp - decoded.iat <= sevenDaysInSeconds + 10);
});

test('generateToken - accepts custom expiration', (t) => {
  const token = generateToken('user-abc', '1h');
  const decoded = jwt.decode(token);

  const oneHourInSeconds = 60 * 60;

  // Allow 10 second tolerance
  assert.ok(decoded.exp - decoded.iat >= oneHourInSeconds - 10);
  assert.ok(decoded.exp - decoded.iat <= oneHourInSeconds + 10);
});

test('generateToken - different userIds produce different tokens', (t) => {
  const token1 = generateToken('user-1');
  const token2 = generateToken('user-2');

  assert.notEqual(token1, token2);
});

test('generateToken - token can be verified with JWT_SECRET', (t) => {
  const token = generateToken('user-verify');

  assert.doesNotThrow(() => {
    jwt.verify(token, JWT_SECRET);
  });
});

test('generateToken - token verification fails with wrong secret', (t) => {
  const token = generateToken('user-wrong-secret');

  assert.throws(
    () => {
      jwt.verify(token, 'wrong-secret');
    },
    {
      name: 'JsonWebTokenError',
    },
  );
});

// ==================== JWT token structure tests ====================
test('JWT structure - has required claims', (t) => {
  const token = generateToken('user-claims');
  const decoded = jwt.decode(token);

  assert.ok(decoded.userId, 'Should have userId');
  assert.ok(decoded.iat, 'Should have issued at (iat)');
  assert.ok(decoded.exp, 'Should have expiration (exp)');
});

test('JWT structure - iat is current timestamp', (t) => {
  const before = Math.floor(Date.now() / 1000);
  const token = generateToken('user-iat');
  const after = Math.floor(Date.now() / 1000);

  const decoded = jwt.decode(token);

  assert.ok(decoded.iat >= before);
  assert.ok(decoded.iat <= after);
});

// ==================== Token expiration tests ====================
test('expired token - throws TokenExpiredError', async (t) => {
  // Create token that expires immediately
  const token = generateToken('user-expired', '0s');

  // Wait a bit for token to expire
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.throws(
    () => {
      jwt.verify(token, JWT_SECRET);
    },
    {
      name: 'TokenExpiredError',
    },
  );
});

// ==================== Helper to create mock authenticate scenario ====================
/**
 * Helper function to create a mock request with authorization header
 */
function createMockReqWithAuth(token) {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
  };
}

/**
 * Helper function to create mock response
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

// Note: Full authenticate middleware tests require mocking the database
// These tests verify the token format and helper behavior
test('mock auth request - correct Bearer format', (t) => {
  const token = generateToken('user-test');
  const req = createMockReqWithAuth(token);

  assert.ok(req.headers.authorization.startsWith('Bearer '));
  assert.equal(req.headers.authorization.split(' ')[1], token);
});

test('mock auth request - no token', (t) => {
  const req = createMockReqWithAuth(null);

  assert.equal(req.headers.authorization, undefined);
});
