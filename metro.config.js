/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

// List of native modules that should be replaced with empty modules for web
const nativeModules = [
  'react-native-maps',
  // Add any other problematic native modules here
];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  ...defaultConfig,
  // Use a file-based cache instead of memory
  cacheStores: [
    new FileStore({ root: path.join(__dirname, 'node_modules/.cache/metro') }),
  ],
  // Reset cache if it causes issues
  resetCache: true,
  transformer: {
    ...defaultConfig.transformer,
    // Add any transformer options here
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: [...assetExts, 'bin'],
    sourceExts: [...sourceExts],
    // Ensure symlinks are followed
    symlinks: true,
    // Add platform-specific extensions
    platforms: ['ios', 'android', 'web'],
    // Add a custom resolver to handle platform-specific imports
    resolveRequest: (context, moduleName, platform) => {
      // Check if this is a native module that should be excluded from web
      if (platform === 'web' && nativeModules.some(name => moduleName.includes(name))) {
        // Return empty module for native modules on web platform
        return {
          filePath: path.resolve(__dirname, 'empty-module.js'),
          type: 'sourceFile',
        };
      }
      
      // Use the default resolver for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  // Add watchFolders to include any linked packages
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],
};

module.exports = config;
