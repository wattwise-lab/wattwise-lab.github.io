import assert from 'node:assert/strict';
const origin = process.env.CALCMINTLY_ORIGIN || 'https://calcmintly.com',
  paths = [
    '/',
    '/basic-calculator',
    '/workspace',
    '/ranking',
    '/plan-collision-calculator',
    '/life-single-point-failure-calculator',
    '/future-commitment-lock-calculator',
    '/release-version.json',
  ];
for (const path of paths) {
  const response = await fetch(origin + path, {
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': 'CalcMintly-Availability-Probe/1.0' },
  });
  assert.equal(response.status, 200, path);
  if (path.endsWith('.json')) {
    const release = await response.json();
    assert.equal(release.catalogTools, 500);
  } else {
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    const html = await response.text();
    assert.match(html, /<h1\b/);
    assert.ok(!html.includes('vinext.navigationRuntime'));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
}
const missing = await fetch(origin + '/this-page-does-not-exist-release-probe', {
  signal: AbortSignal.timeout(20000),
});
assert.equal(missing.status, 404);
console.log(
  'Availability probe passed for eight routes and true 404. This is a point-in-time probe, not real-user performance data.',
);
