const rules = require('./webpack.rules');
const path = require('path');
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, 'src');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const {TsConfigPathsPlugin} = require('awesome-typescript-loader');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const nonce = Math.random().toString().substr(2);

rules.push(
  {
    test: /\.css$/,
    use: [
      {
        loader: 'style-loader',
        options: {
          attributes: {
            nonce: nonce,
          },
        },
      },
      {loader: 'css-loader'},
    ],
  },
  {
    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          attributes: {
            nonce: nonce,
          },
        },
      },
    ],
  }
);

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    alias: {
      root: SRC,
    },
    extensions: ['.js', '.ts', '.tsx'],
    modules: [NODE_MODULES],
    plugins: [TsConfigPathsPlugin],
  },
  plugins: [
    new CspHtmlWebpackPlugin(
      {
        'base-uri': "'self'",
        'object-src': "'none'",
        'script-src': ["'self'"],
        'img-src': ["'self'", 'https://mtgarena.pro/', 'data:'],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
      {
        enabled: true,
        hashingMethod: 'sha256',
        hashEnabled: {
          'script-src': false,
          'style-src': false,
        },
        nonceEnabled: {
          'script-src': false,
          'style-src': false,
        },
      }
    ),
    new CopyPlugin([
      {context: 'src/windows', from: '*.woff*', to: 'home_window'},
      {context: 'src/windows', from: '*.woff*', to: 'overlay_window'},
    ]),
  ],
};
