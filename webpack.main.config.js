const path = require('path');
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, 'src');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const WebpackHookPlugin = require('webpack-hook-plugin').default;

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
  plugins:
    process.platform === 'darwin'
      ? [
          new WebpackHookPlugin({
            onBuildEnd: ['chmod +x .webpack/main/native_modules/main'],
          }),
        ]
      : [],
  resolve: {
    alias: {
      root: SRC,
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    modules: [NODE_MODULES],
  },
};
