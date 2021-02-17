import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";

export default {
  entry: path.resolve(process.cwd(), "src/index.mjs"),
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  output: {
    path: path.resolve(process.cwd(), "dist"),
    filename: "four.js",
    library: "$",
    libraryTarget: "umd",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "src/css", to: "css" },
        { from: "src/fonts", to: "fonts" },
        { from: "src/img", to: "img" },
        { from: "src/workers", to: "workers" },
      ],
    }),
  ]
};
