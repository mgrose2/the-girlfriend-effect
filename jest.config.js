module.exports = {
  preset: '@react-native/jest-preset',
  // These ship untranspiled ESM, which the preset's default of ignoring all of
  // node_modules would leave unprocessed. Add to this list whenever a new
  // native package turns up as "Cannot use import statement outside a module".
  transformIgnorePatterns: [
    'node_modules/(?!(?:' +
      [
        '@react-native',
        'react-native',
        '@react-navigation',
        'react-native-screens',
        'react-native-safe-area-context',
        '@react-native-async-storage',
        'react-native-image-picker',
        '@react-native-firebase',
      ].join('|') +
      ')/)',
  ],
};
