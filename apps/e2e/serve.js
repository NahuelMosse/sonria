// Static server for the tests: serves the page at / and at /sonria/, the subpath GitHub Pages publishes it under.
// It serves only the files the page ships (index.html, styles.css and the sheets it imports, app.js and assets/), on PORT.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};
const SHIPPED = /^(index\.html|styles\.css|design\/(tokens|base|components\/sonria)\.css|app\.js|assets\/[\w.-]+)$/;

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/sonria(?=\/|$)/, '').replace(/^\/+/, '');
  if (rel === '') rel = 'index.html';
  const file = path.join(ROOT, rel);
  if (!SHIPPED.test(rel) || !fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => console.log(`serving on http://127.0.0.1:${PORT}/sonria/`));

const stop = () => { server.closeAllConnections(); server.close(() => process.exit(0)); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
