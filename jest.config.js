module.exports = {
   testMatch: [
      "**/tests/*.test.{ts,tsx,js}"
    ],
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: [
        '<rootDir>/tests/setupTests.ts'
    ],
    transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
};

