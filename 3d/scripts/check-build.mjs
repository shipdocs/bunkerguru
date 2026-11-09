import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';

// Follow the actual HTML/CSS/ESM graph: missing copied or moved files fail before publishing.
const base = path.join(root, 'dist');
const visited = new Set();
async function visit(filename) {
  if (visited.has(filename)) return;
  visited.add(filename);
  if (!filename.startsWith(base + path.sep)) throw new Error('Asset escapes dist: ' + filename);
  if (!(await stat(filename)).isFile()) throw new Error('Not a file: ' + filename);
  const text = await readFile(filename, 'utf8');
  const refs = filename.endsWith('.html')
    ? [...text.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
    : /\.(mjs|js)$/.test(filename)
      ? [...text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map((m) => m[1])
      : filename.endsWith('.css')
        ? [...text.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map((m) => m[1])
        : [];
  for (const ref of refs) {
    if (/^(https?:|data:|#)/.test(ref) || ref.endsWith('/')) continue; // links to other pages
    await visit(path.resolve(path.dirname(filename), ref.split('?')[0]));
  }
}
await visit(path.join(base, 'index.html'));
console.log(`Verified ${visited.size} linked files in the published asset graph.`);
