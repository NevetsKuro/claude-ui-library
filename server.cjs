/**
 * Dev server for claude-ui-library
 * Serves the project on localhost:3000
 */

const { createServer } = require('http');
const { parse } = require('url');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// Simple MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getFileExtension(filePath) {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot > 0 ? filePath.slice(lastDot) : '';
}

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Serve index.html for root path
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  let filePath = join(ROOT_DIR, pathname);

  // Try the requested file
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath);
      const ext = getFileExtension(filePath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
      return;
    } catch (err) {
      res.writeHead(500);
      res.end('Error reading file');
      return;
    }
  }

  // If not found, return 404
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404 - Not Found</h1>');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
