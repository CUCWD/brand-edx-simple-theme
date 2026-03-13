#!/usr/bin/env node
// watch-theme.js
const { execSync } = require('child_process');
const path = require('path');

const changedPath = process.argv[2];
const forceAll = process.argv.includes('--all');

if (!changedPath && !forceAll) {
  console.error('Usage: watch-theme.js {path} [--all]');
  process.exit(1);
}

function run(cmd) {
  console.log('> ' + cmd);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('Command failed:', cmd);
  }
}

if (forceAll) {
  console.log('Rebuilding ALL themes (forced).');
  run('npm run build-tokens --all');
  run('npm run build');
  process.exit(0);
}

// Example changedPath: tokens/themes/<variant>/theme.toml
const parts = changedPath.split(path.sep);
const themesIdx = parts.indexOf('themes');
let variant = null;
if (themesIdx >= 0 && parts.length > themesIdx + 1) {
  variant = parts[themesIdx + 1];
}

// Fallback: if file is in tokens/... but not themes/<variant>/ ... (e.g. core), attempt to infer
if (!variant && changedPath.includes('tokens')) {
  // try tokens/<variant>/...
  const tokensIdx = parts.indexOf('tokens');
  if (tokensIdx >= 0 && parts.length > tokensIdx + 1) {
    variant = parts[tokensIdx + 1];
  }
}

if (!variant) {
  console.log('Could not infer variant from path:', changedPath, '\nFalling back to full build.');
  run('npm run build-tokens --all');
  run('npm run build');
  process.exit(0);
}

console.log(`Rebuilding only variant: ${variant}`);

// build-tokens-variant script should accept an optional variant argument
run(`npm run build-tokens-variant -- --themes ${variant}`);
// build should accept variant (or you can scope build to output folder)
// run(`npm run build -- ${variant}`);
// at this time build-scss doesn't support building a single variant, so we will build all SCSS but only output the changed variant's CSS
run(`npm run build`);

// touch a file that signals the MFE / static server (optional)
// run(`touch ./dist/${variant}/.updated`);

// don't restart MFE if you are mounting / syncing dist into the MFE container
console.log('Done.');