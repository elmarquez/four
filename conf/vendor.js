module.exports = {
  manifests: {
    preDevelop: {
      sourcePath: 'vendor',
      targetPath: 'src/webapp/js-libs/',
      maps: {
        'bluebird': 'bluebird/js/browser/*.js',
        'golden-layout': 'golden-layout/dist'
      }
    }
  }
};