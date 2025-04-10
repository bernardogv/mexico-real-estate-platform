// Minimal Jest configuration with no special setup
module.exports = {
  testEnvironment: 'node',
  // Don't use any setup files
  setupFilesAfterEnv: [],
  // Simplest matching pattern
  testRegex: '.*\.test\.js$'
};
