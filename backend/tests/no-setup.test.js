/**
 * This test file doesn't import or use any setup files
 * It should run regardless of any issues with Jest configuration
 */

describe('Basic Test Without Setup', () => {
  test('Basic test that should always pass', () => {
    expect(true).toBe(true);
  });

  test('Math operations work', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 5).toBe(25);
  });
});
