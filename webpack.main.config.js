const path = require('path');
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, 'src');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const { TsConfigPathsPlugin } = require('awesome-typescript-loader');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.ts',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    alias: {
      root: SRC,
    },
    extensions: ['.js', '.ts', '.tsx'],
    modules: [NODE_MODULES],
    plugins: [TsConfigPathsPlugin],
  },
  externals: /Debug\/iconv\.node/,
};
