const path = require('path')

module.exports = {

  paths: function(paths, env) {
    paths.appIndexJs = path.resolve(__dirname, 'frontend/src/index.tsx')
    paths.appSrc = path.resolve(__dirname, 'frontend/src')
    paths.appPublic = path.resolve(__dirname, 'frontend/public')
    paths.appHtml = path.resolve(__dirname, 'frontend/public/index.html')
    return paths;

  }
}