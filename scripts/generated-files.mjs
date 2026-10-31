import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// One inventory shared by release preparation and the clean-check gate.
export const generatedPaths = [
  '*.html',
  'assets',
  'sitemap.xml',
  'robots.txt',
  '_redirects',
  'release-version.json',
  'src/asset-manifest.json',
  'src/translation-coverage.json',
  'src/native-structure-report.json',
  'src/locale-routes.json',
  'src/selection-priority.json',
];

export function generatedStatus() {
  return execFileSync(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all', '--', ...generatedPaths],
    { encoding: 'utf8' },
  );
}

async function snapshot(root) {
  const files = {};
  async function visit(folder) {
    for (const entry of await fs.readdir(path.join(root, folder), { withFileTypes: true })) {
      if (
        entry.name.startsWith('.') ||
        ['node_modules', '_next', 'browser-evidence'].includes(entry.name)
      )
        continue;
      const relative = path.posix.join(folder, entry.name);
      if (entry.isDirectory()) await visit(relative);
      else if (
        entry.isFile() &&
        (relative.endsWith('.html') ||
          relative.startsWith('assets/') ||
          generatedPaths.includes(relative))
      ) {
        files[relative] = createHash('sha256')
          .update(await fs.readFile(path.join(root, relative)))
          .digest('hex');
      }
    }
  }
  await visit('');
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, 'en')));
}

if (process.argv[2] === '--check') {
  const changes = generatedStatus();
  if (changes) {
    console.error(
      'Generated release files differ from the committed artifact, including untracked files:\n' +
        changes,
    );
    process.exitCode = 1;
  } else console.log('All generated files match the committed release.');
} else if (process.argv[2] === '--snapshot') {
  await fs.writeFile(
    process.argv[3],
    JSON.stringify(await snapshot(process.cwd()), null, 2) + '\n',
  );
} else if (process.argv[2] === '--compare') {
  const before = JSON.parse(await fs.readFile(process.argv[3], 'utf8'));
  const after = await snapshot(process.cwd());
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (file) => before[file] !== after[file],
  );
  if (changed.length) {
    console.error('A repeated build changed release files:', changed);
    process.exitCode = 1;
  } else
    console.log(
      'Repeated build is byte-identical across ' + Object.keys(after).length + ' generated files.',
    );
}
