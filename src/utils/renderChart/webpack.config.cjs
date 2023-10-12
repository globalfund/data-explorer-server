const path = require('path');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.cjs', // Output filename
  },
  performance: {
    maxEntrypointSize: 1024 * 1024 * 10, // allow 10mb for the packed file
  },
  target: 'node',
};
