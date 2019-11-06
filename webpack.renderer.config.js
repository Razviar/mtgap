const rules = require("./webpack.rules");
const path = require("path");
const ROOT = path.resolve(__dirname);
const SRC = path.join(ROOT, "src");
const NODE_MODULES = path.join(ROOT, "node_modules");
const { TsConfigPathsPlugin } = require("awesome-typescript-loader");

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }]
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules
  },
  resolve: {
    alias: {
      root: SRC
    },
    extensions: [".js", ".ts"],
    modules: [NODE_MODULES],
    plugins: [TsConfigPathsPlugin]
  }
};
