const path = require('path');
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, 'src');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const CopyPlugin = require('copy-webpack-plugin');

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
  plugins: [
    new CopyPlugin({
      patterns: [
        {context: 'src/our-active-win', from: '*.dll*', to: 'native_modules'},
        {context: 'src/our-active-win', from: '*.pdb*', to: 'native_modules'},
      ],
    }),
  ],
  resolve: {
    alias: {
      root: SRC,
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    modules: [NODE_MODULES],
  },
};
