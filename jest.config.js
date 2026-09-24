module.exports = {
  preset: '@react-native/jest-preset',
  // React Navigation and react-native-screens ship untranspiled ESM, which the
  // preset's default of ignoring all of node_modules would leave unprocessed.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
