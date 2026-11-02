// ESLint flat config without plugins, so `npx eslint` runs without installing anything in the repo.
const node = { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly', Buffer: 'readonly', console: 'readonly', URL: 'readonly', setTimeout: 'readonly' };
const browser = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly', console: 'readonly',
  IntersectionObserver: 'readonly', matchMedia: 'readonly', requestAnimationFrame: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', URL: 'readonly',
};
const rules = {
  'no-undef': 'error', 'no-unused-vars': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error',
  'no-unreachable': 'error', 'no-constant-condition': 'error', 'eqeqeq': 'error', 'prefer-const': 'error', 'no-var': 'error',
};

module.exports = [
  // The tests also hand functions to the browser (page.evaluate), which run with the page's globals.
  {
    files: ['apps/e2e/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'commonjs',
      globals: { ...browser, ...node, fetch: 'readonly', getComputedStyle: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly', DOMMatrix: 'readonly' },
    },
    rules,
  },
  { files: ['app.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: browser }, rules },
];
