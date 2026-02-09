const test = require('node:test');
// Use strict assertion mode for better error messages
const assert = require('node:assert/strict');

// Simple synchronous test
test('basic arithmetic', (t) => {
  // Assert that 1 + 1 equals 2
  assert.equal(1 + 1, 2, '1 + 1 should equal 2');

  // Deep equality check for objects/arrays
  assert.deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } });
});
// Asynchronous test with async/await
test('async test', async (t) => {
  const result = await Promise.resolve('async result');
  assert.strictEqual(result, 'async result');
});
