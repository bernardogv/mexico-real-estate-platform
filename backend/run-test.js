/**
 * Manual test runner that doesn't rely on Jest's test discovery
 * Run with: node run-test.js
 */

// Import basic assertion library
const assert = require('assert');

console.log('Starting simple test run...');

// Simple test function
function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Define some tests
const tests = [
  {
    name: 'Truth test',
    fn: () => assert.strictEqual(true, true)
  },
  {
    name: 'Math test', 
    fn: () => {
      assert.strictEqual(1 + 1, 2);
      assert.strictEqual(5 * 5, 25);
    }
  },
  {
    name: 'String test',
    fn: () => {
      assert.strictEqual('hello' + ' world', 'hello world');
      assert.strictEqual('test'.toUpperCase(), 'TEST');
    }
  }
];

// Run the tests
let passed = 0;
let total = tests.length;

for (const t of tests) {
  if (test(t.name, t.fn)) {
    passed++;
  }
}

// Print summary
console.log(`\nTest summary: ${passed}/${total} tests passed`);
if (passed === total) {
  console.log('All tests passed! 🎉');
} else {
  console.log(`${total - passed} tests failed ❌`);
  process.exit(1);
}
