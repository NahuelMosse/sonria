// Loads @playwright/test from the repo, or from the Playwright install the test runner itself was started from
// (KIT_PLAYWRIGHT_ROOT, or the folder of the CLI), so the spec and the runner share one instance.
const path = require('path');

const candidates = [
  () => require('@playwright/test'),
  () => process.env.KIT_PLAYWRIGHT_ROOT && require(path.join(process.env.KIT_PLAYWRIGHT_ROOT, 'node_modules', '@playwright', 'test')),
  () => require(require.resolve('@playwright/test', { paths: [path.dirname(process.argv[1] || '.')] })),
];

let loaded;
for (const attempt of candidates) {
  try { loaded = attempt(); } catch { loaded = undefined; }
  if (loaded) break;
}
if (!loaded) throw new Error('@playwright/test was not found: run npm install, or set KIT_PLAYWRIGHT_ROOT');

module.exports = loaded;
