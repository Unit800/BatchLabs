const config = require("./webpack.config.base");
const path = require("path");
const webpack = require("webpack");
var merge = require("webpack-merge");
var failPlugin = require("webpack-fail-plugin");

const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

module.exports = merge(config, {
    devtool: "cheap-module-source-map",
    debug: true,
    devServer: { host, port },
    output: {
        path: path.join(__dirname, "../build/"),
        filename: "[name].js",
        sourceMapFilename: "[name].js.map",
        chunkFilename: "[id].chunk.js",
    },
    plugins: [
        new CommonsChunkPlugin({ name: "polyfills", filename: "polyfills.js", minChunk: Infinity }),
        failPlugin,
    ],
});