module.exports = {
   testMatch: [
      "src/**/__tests__/*.test.{ts,tsx,js}",
    ],
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: [
        '<rootDir>/setupTests.ts'
    ],
    collectCoverageFrom:[
        "src/**/*.{ts,tsx}"
    ],
    transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
};

