const path = require('path')

module.exports = {

  paths: function(paths, env) {
    paths.appIndexJs = path.resolve(__dirname, 'frontend/src/index.tsx')
    paths.appSrc = path.resolve(__dirname, 'frontend/src')
    paths.appPublic = path.resolve(__dirname, 'frontend/public')
    paths.appHtml = path.resolve(__dirname, 'frontend/public/index.html')
    return paths;
  },
  jest: function(config) {
    config.rootDir = "."
    config.roots = [
        "tests"
    ]
    config.testMatch = [
           "**/tests/*.test.{ts,tsx,js}"
    ]
    config.setupFilesAfterEnv = [
        '<rootDir>/tests/setupTests.ts'
    ]
    config.collectCoverageFrom = [
        "frontend/src/**/*.tsx"
    ]
    return config
  }
}