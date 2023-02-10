module.exports = {
   testMatch: [
      "**/tests/*.test.{ts,tsx,js}"
    ],
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: [
        '<rootDir>/tests/setupTests.ts'
    ],
    collectCoverageFrom:[
        "src/**/*.{ts,tsx}"
    ],
    transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
};

