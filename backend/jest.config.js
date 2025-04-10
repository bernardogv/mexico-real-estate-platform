module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    '!src/controllers/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['./tests/jest.setup.js'],
  moduleFileExtensions: ['js', 'json'],
  moduleDirectories: ['node_modules']
};
