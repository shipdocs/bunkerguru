import { spawnSync } from 'node:child_process';
import { root } from './build.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const result = spawnSync(process.execPath, ['--test', 'tests/ui-smoke.test.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    GAME_MODULE_URL: pathToFileURL(path.join(root, 'dist/src/app/create-game.mjs')).href,
    GAME_HTML_URL: pathToFileURL(path.join(root, 'dist/index.html')).href,
  },
});
process.exit(result.status ?? 1);
