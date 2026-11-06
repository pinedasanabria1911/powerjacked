// Two targets from one source:
//   src/dist/demo.html   - prototype, carries synthetic demo data
//   index.html           - production, carries the program only, no measurements
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const demoDir = path.join(dir, 'dist');
fs.mkdirSync(demoDir, {recursive: true});

// Normalise line endings on read. A CRLF checkout would make the "\n"-anchored
// substitutions below miss silently and ship the demo banner in the production page.
const lf = s => s.replace(/\r\n/g, '\n');
const shell = lf(fs.readFileSync(path.join(dir, 'app.html'), 'utf8'));
if (!shell.includes('// <<<SEED>>>')) throw new Error('seed marker missing');

// --- prototype -------------------------------------------------------------
const demo = lf(fs.readFileSync(path.join(dir, 'seed.demo.js'), 'utf8')).trim();
fs.writeFileSync(path.join(demoDir, 'demo.html'), shell.replace('// <<<SEED>>>', demo));

// --- production ------------------------------------------------------------
const demoSeed = eval(demo + '; SEED');
const prod = {
  program: demoSeed.program,
  settings: demoSeed.settings,
  weighins: [], nutrition: [], workouts: [], rehab: [], bodycomp: [],
  meta: {createdBy: 'powerjacked', configAt: 0},
};
const prodSeed = '// Starting state: the program and goal. No measurements ship with the app.\n'
  + 'const SEED = ' + JSON.stringify(prod, null, 1) + ';\n';

let body = shell.replace('// <<<SEED>>>', prodSeed);
// the artifact viewer supplies its own <head>; a standalone page needs a real one,
// above all the viewport meta, without which iOS lays the page out at 980px
body = body.replace(/^<title>[^<]*<\/title>\s*/, '');
// the prototype banner is about demo data, which production does not have
body = body.replace(
  /\n  <div class="protobar">[\s\S]*?<\/div>\n/,
  '\n  <div class="protobar" id="firstRun">\n'
  + '    <b>Not connected.</b> Open Setup and connect your private repository so entries are\n'
  + '    committed there rather than living only in this browser.\n'
  + '  </div>\n');

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Powerjacked</title>
<meta name="description" content="Personal training, weight and nutrition tracker.">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EEF0F0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C1113" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Powerjacked">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
</head>
<body>
${body}
</body>
</html>
`;

const manifest = {
  name: 'Powerjacked',
  short_name: 'Powerjacked',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0C1113',
  theme_color: '#0C1113',
  icons: [
    {src: 'icon-192.png', sizes: '192x192', type: 'image/png'},
    {src: 'icon-512.png', sizes: '512x512', type: 'image/png'},
    {src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
  ],
};
const dist = path.join(dir, '..');
fs.mkdirSync(dist, {recursive: true});
fs.writeFileSync(path.join(dist, 'index.html'), page);
fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log('prototype', shell.replace('// <<<SEED>>>', demo).length, 'bytes');
console.log('production', page.length, 'bytes');
