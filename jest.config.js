// jest.config.js - Jest Configuration
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  collectCoverageFrom: [
    'app.js',
    'logger.js',
    'config/**/*.js',
    'controllers/**/*.js',
    'database/**/*.js',
    'DataServices/**/*.js',
    'LogicServices/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
};
