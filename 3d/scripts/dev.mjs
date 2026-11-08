import http from 'node:http';
import { watch, createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { build, root } from './build.mjs';

const output = await build();
let pending = Promise.resolve(),
  timer;
for (const folder of ['src', 'styles', 'vendor'])
  watch(path.join(root, folder), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      pending = pending
        .then(build)
        .then(() => console.log('Rebuilt; refresh the browser.'))
        .catch(console.error);
    }, 100);
  });
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.mjs': 'text/javascript',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const server = http.createServer(async (req, res) => {
  try {
    await pending;
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(output, '.' + (requested === '/' ? '/index.html' : requested));
    if (!file.startsWith(output + path.sep) || !(await stat(file)).isFile())
      throw new Error('Not found');
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
const port = Number(process.env.PORT) || 4173;
server.listen(port, '0.0.0.0', () => console.log(`Bunkerguru: http://localhost:${port}`));
