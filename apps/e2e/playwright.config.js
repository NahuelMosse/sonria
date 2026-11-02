module.exports = {
  testDir: __dirname,
  testMatch: /.*\.spec\.js$/,
  timeout: 30_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  outputDir: '../../.validation/e2e-results',
  use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
};
