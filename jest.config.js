module.exports = {
  testEnvironment: 'jsdom',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/config.js',
    '!js/config.example.js',
    '!js/modules-shim.js'
  ],
  coverageReporters: ['html', 'text', 'lcov'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'eTrener - Test Report',
        outputPath: 'test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: 'darkTheme',
        sort: 'status'
      }
    ]
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Support ES6 modules
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  transformIgnorePatterns: ['node_modules/(?!(@supabase)/)']
};
