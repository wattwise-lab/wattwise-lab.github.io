import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { pruneAssets } from './prune-assets.mjs';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'calcmintly-assets-')),
  root = pathToFileURL(directory + path.sep);
try {
  await fs.mkdir(new URL('assets/dist/', root), { recursive: true });
  async function asset(name, content) {
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 12),
      relative = 'assets/dist/' + name + '.' + hash + '.js';
    await fs.writeFile(new URL(relative, root), content);
    return relative;
  }
  const current = await asset('current', 'current release'),
    previous = await asset('zh-CN', 'previous language dictionary'),
    unused = await asset('obsolete', 'reproducible stale output');
  await fs.writeFile(new URL('assets/dist/user-note.txt', root), 'Keep this unknown file');
  await fs.writeFile(new URL('assets/dist/unverified.000000000000.js', root), 'Not a valid hash');
  const result = await pruneAssets(root, new Set([current]), { language: '/' + previous });
  assert.equal(result.removed, 1);
  assert.equal(result.removedBytes, Buffer.byteLength('reproducible stale output'));
  assert.equal(result.keptRetained, 1);
  assert.equal(result.unavailableRetained, 0);
  for (const file of [
    current,
    previous,
    'assets/dist/user-note.txt',
    'assets/dist/unverified.000000000000.js',
  ])
    await fs.access(new URL(file, root));
  await assert.rejects(fs.access(new URL(unused, root)));
  assert.equal(
    (await pruneAssets(root, new Set([current]), { language: '/' + previous })).removed,
    0,
  );
  await assert.rejects(pruneAssets(root, new Set(), { bad: '/assets/dist/../source.js' }));
  const missing = await pruneAssets(root, new Set([current]), {
    missing: '/assets/dist/missing.111111111111.js',
    language: '/' + previous,
  });
  assert.equal(missing.unavailableRetained, 1);
  console.log(
    'Asset retention: current/previous dictionaries preserved; only content-verified stale output removed; unknown files, idempotence and path validation PASS',
  );
} finally {
  await fs.rm(directory, { recursive: true, force: true });
}
