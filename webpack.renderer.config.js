const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const path = require('path');
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, 'src');
const NODE_MODULES = path.join(ROOT, 'node_modules');
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
    type: 'asset/resource',
    dependency: {not: ['url']},
  }
);

module.exports = {
  // Put your normal webpack config below here
  devtool: 'source-map',
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    alias: {
      root: SRC,
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.woff', '.woff2', '.ttf', '.eot', '.svg'],
    modules: [NODE_MODULES],
  },
  plugins: [
    new CspHtmlWebpackPlugin(
      {
        'base-uri': "'self'",
        'default-src': [
          "'self'",
          'https://mtgarena.pro/',
          'https://static.mtgarena.pro/',
          'https://static2.mtgarena.pro/',
          'data:',
        ],
        'object-src': "'none'",
        'img-src': [
          "'self'",
          'https://mtgarena.pro/',
          'https://static.mtgarena.pro/',
          'https://static2.mtgarena.pro/',
          'data:',
        ],
        'script-src': ["'self'"],
        'style-src': [
          "'self'",
          'https://mtgarena.pro/',
          'https://static.mtgarena.pro/',
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        'font-src': [
          "'self'",
          'https://mtgarena.pro/',
          'https://static.mtgarena.pro/',
          'https://static2.mtgarena.pro/',
          'https://fonts.gstatic.com',
        ],
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
    new CopyPlugin({
      patterns: [
        {context: 'src/windows', from: '*.woff*', to: 'home_window'},
        {context: 'src/windows', from: '*.woff*', to: 'overlay_window'},
      ],
    }),
  ],
};
