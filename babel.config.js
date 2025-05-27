/**
 * Babel configuration for the Vehicle Tracker app
 */

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add module resolver for cleaner imports
      [
        'module-resolver',
        {
          alias: {
            // This helps with resolving imports
            '@components': './components',
            '@services': './services',
            '@utils': './utils',
            '@assets': './assets',
          },
        },
      ],
      // Add any other plugins as needed
    ],
  };
};
