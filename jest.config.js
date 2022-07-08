module.exports = {
   testMatch: [
      "**/tests/*.test.{ts,tsx,js}"
    ],
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: [
        '<rootDir>/tests/setupTests.ts'
    ],
    collectCoverageFrom:[
        "frontend/src/**/*.{ts,tsx}"
    ],
    transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
};

