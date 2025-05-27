const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');
const webDirectory = path.resolve(appDirectory, 'web');

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being
// published to npm. If you depend on uncompiled packages they may cause webpack build
// errors. To fix this webpack can be configured to compile to the necessary `node_module`.
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    path.resolve(appDirectory, 'index.js'),
    path.resolve(appDirectory, 'App.js'),
    path.resolve(appDirectory, 'components'),
    path.resolve(appDirectory, 'services'),
    path.resolve(appDirectory, 'utils'),
    // Add additional directories as needed
    // Exclude node_modules that should be skipped
    /node_modules(?!\/(@react-native|react-native|expo))/,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      // The 'metro-react-native-babel-preset' preset is recommended to match React Native's packager
      presets: ['module:metro-react-native-babel-preset'],
      // Re-write paths to import only the modules needed by the app
      plugins: ['react-native-web'],
    },
  },
};

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
};

// Configure file loader for other assets
const fileLoaderConfiguration = {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  use: {
    loader: 'file-loader',
    options: {
      name: '[name].[ext]',
    },
  },
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isDevelopment = mode === 'development';
  
  return {
    mode,
    
    // Path to the entry file, change if needed
    entry: path.resolve(appDirectory, 'index.js'),
    
    // Path and filename of the output bundle
    output: {
      path: path.resolve(webDirectory, 'dist'),
      filename: 'bundle.[contenthash].js',
      publicPath: '/',
    },
    
    // Enable source maps for debugging webpack's output
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    
    // Configure module resolution
    resolve: {
      // Allow importing files without extensions
      extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
      // Alias for react-native to react-native-web
      alias: {
        'react-native$': 'react-native-web',
        'react-native-maps': 'react-native-web-maps',
      },
    },
    
    // Configure loaders
    module: {
      rules: [
        babelLoaderConfiguration,
        imageLoaderConfiguration,
        fileLoaderConfiguration,
      ],
    },
    
    // Configure plugins
    plugins: [
      // Clean the output directory before build
      new CleanWebpackPlugin(),
      
      // Generate an HTML file with the bundle injected
      new HtmlWebpackPlugin({
        template: path.resolve(webDirectory, 'index.html'),
        filename: 'index.html',
        inject: true,
      }),
      
      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(appDirectory, 'assets'),
            to: 'assets',
          },
          // Add more patterns as needed
        ],
      }),
      
      // Define environment variables
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(isDevelopment),
        process: { env: { NODE_ENV: JSON.stringify(mode) } },
      }),
    ],
    
    // Development server configuration
    devServer: {
      static: {
        directory: path.resolve(webDirectory, 'dist'),
      },
      historyApiFallback: true,
      compress: true,
      port: 3000,
      hot: true,
      open: true,
    },
    
    // Optimization
    optimization: {
      minimize: !isDevelopment,
      splitChunks: {
        chunks: 'all',
        name: false,
      },
    },
  };
};
