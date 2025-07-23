/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  testTimeout: 60000, // 60 seconds for browser automation
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'tests/e2e/**/*.ts',
    '!tests/e2e/setup/**',
  ],
  coverageDirectory: 'coverage/e2e',
  verbose: true,
};