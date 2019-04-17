const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: path.join(__dirname, "..", "src", "index.js"),
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        use: {
          loader: "url-loader"
        }
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "fonts/"
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        SERVICE_ADDR: JSON.stringify(process.env.SERVICE_ADDR)
      }
    }),
    new HtmlWebpackPlugin({ template: "./src/index.html" })
  ],
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".jsx", ".json"]
  }
};
