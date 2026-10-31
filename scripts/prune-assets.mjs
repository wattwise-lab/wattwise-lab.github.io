import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const fingerprint = /^([a-z0-9._-]+)\.([a-f0-9]{12})\.([a-z0-9]+)$/i;
export async function pruneAssets(root, referenced, retainedManifest = {}) {
  const retained = new Set();
  for (const value of Object.values(retainedManifest)) {
    if (typeof value !== 'string' || !value.startsWith('/assets/dist/'))
      throw new Error('Invalid retained asset path');
    const filename = value.slice('/assets/dist/'.length);
    if (!fingerprint.test(filename)) throw new Error('Invalid retained asset fingerprint');
    retained.add('assets/dist/' + filename);
  }
  let removed = 0,
    removedBytes = 0,
    keptRetained = 0,
    unavailableRetained = retained.size;
  for (const entry of await fs.readdir(new URL('assets/dist/', root), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const relative = 'assets/dist/' + entry.name;
    if (retained.has(relative)) unavailableRetained--;
    if (referenced.has(relative)) continue;
    if (retained.has(relative)) {
      keptRetained++;
      continue;
    }
    const match = entry.name.match(fingerprint);
    if (!match) continue;
    const file = new URL(relative, root),
      bytes = await fs.readFile(file);
    // Only remove a reproducible generated fingerprint whose content verifies it.
    // Unknown files and incorrectly named files are preserved for manual review.
    if (createHash('sha256').update(bytes).digest('hex').slice(0, 12) !== match[2]) continue;
    await fs.unlink(file);
    removed++;
    removedBytes += bytes.length;
  }
  return { removed, removedBytes, keptRetained, unavailableRetained };
}
