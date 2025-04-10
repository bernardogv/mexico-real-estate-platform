/**
 * Super simple Jest test file that should run regardless of config
 */

// This file is placed at the root level, not in the tests directory
// It doesn't depend on any setup files or Jest configuration

describe('Absolute Basic Test', () => {
  test('Truthy values', () => {
    expect(true).toBe(true);
    expect(1).toBeTruthy();
    expect('test').toBeTruthy();
  });

  test('Math operations', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 5).toBe(25);
    expect(10 / 2).toBe(5);
  });

  test('String operations', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.toUpperCase()).toBe('TEST');
    expect('  trim  '.trim()).toBe('trim');
  });
});
