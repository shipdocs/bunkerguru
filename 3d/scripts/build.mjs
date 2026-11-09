import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function build() {
  const output = path.join(root, 'dist');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(root, 'index.html'), path.join(output, 'index.html'));
  await cp(path.join(root, 'styles'), path.join(output, 'styles'), { recursive: true });
  await cp(path.join(root, 'src'), path.join(output, 'src'), { recursive: true });
  await cp(path.join(root, 'vendor'), path.join(output, 'vendor'), { recursive: true });
  // Preserve the source CSS cascade exactly, without nine extra mobile requests.
  const manifest = await readFile(path.join(root, 'styles/main.css'), 'utf8');
  const layers = [...manifest.matchAll(/@import url\(['"]\.\/([^'"]+)['"]\);/g)].map((m) => m[1]);
  if (!layers.length) throw new Error('No CSS layers in styles/main.css');
  const css = await Promise.all(
    layers.map((name) => readFile(path.join(root, 'styles', name), 'utf8')),
  );
  await writeFile(path.join(output, 'styles/main.css'), css.join('\n'));
  return output;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await build();
  console.log('Built dist/ from src/, index.html, styles/ and vendor/.');
}
