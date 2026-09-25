module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Jest globals are not in scope for the config-level setup file.
      files: ['jest.setup.js'],
      env: { jest: true },
    },
    {
      // The no-refactor guarantee: screens talk to `data/ports` types and get
      // instances from `useRepositories()`. If a screen can reach a concrete
      // adapter, swapping the backend stops being a one-line change.
      files: ['src/features/**/*.ts', 'src/features/**/*.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/data/local',
                  '**/data/local/**',
                  '**/data/firestore',
                  '**/data/firestore/**',
                  '**/data/seed',
                  '**/data/seed/**',
                ],
                message:
                  'features/ must not import a concrete adapter or seed data. Import types from data/ports and get instances from useRepositories().',
              },
            ],
          },
        ],
      },
    },
    {
      // domain/ is pure: types and logic only, so it stays testable without a
      // renderer or a device.
      files: ['src/domain/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-native', '**/data/**', '**/features/**', '**/ui/**'],
                message:
                  'domain/ must stay pure — no React, no I/O, no dependency on data, features, or ui.',
              },
            ],
          },
        ],
      },
    },
  ],
};
