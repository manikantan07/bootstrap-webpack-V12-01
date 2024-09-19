const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { webpack } = require("webpack");

module.exports = {
  entry: './src/app.js',
  mode: 'development',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development'
            }
          },
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    // new ProvidePlugin({
    //   $: "jquery",
    //   jQuery: ["jquery", "$"],
    //   "window.jQuery": "jquery",
    // }),
    // new WebpackCriticalCSSInliner({
    //   base: 'dist/',
    //   inlineGoogleFonts: true,
    //   minify: true,
    // })
  ]
};