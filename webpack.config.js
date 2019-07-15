const path = require('path');

const entrypoint = path.join(__dirname, 'client');
const outputPath = path.join(__dirname, 'extension', 'popup');

module.exports = {
  watch: true,
  entry: path.join(entrypoint, 'index.jsx'),
  output: {
    path: outputPath,
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  mode: 'development'
};
