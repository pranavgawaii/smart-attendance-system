import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.cwd(), 'dist');
const maxJsKb = Number(process.env.BUNDLE_BUDGET_MAX_JS_KB || 1200);
const maxCriticalAssetKb = Number(process.env.BUNDLE_BUDGET_MAX_ASSET_KB || 2000);
const allowlistFilePath = path.resolve(process.cwd(), 'bundle-budget.allowlist');
const allowlistFromFile = fs.existsSync(allowlistFilePath)
  ? fs
      .readFileSync(allowlistFilePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  : [];
const allowlistFromEnv = String(process.env.BUNDLE_BUDGET_ALLOWLIST || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const allowlist = new Set([...allowlistFromFile, ...allowlistFromEnv]);

const mediaExtensions = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif'
]);

const toKb = (bytes) => Number((bytes / 1024).toFixed(2));

if (!fs.existsSync(distDir)) {
  console.error(`[bundle-budget] Missing directory: ${distDir}`);
  process.exit(1);
}

const collectFiles = (rootDir, childPath = '') => {
  const targetPath = path.join(rootDir, childPath);
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    const relativePath = path.join(childPath, entry.name);
    const absolutePath = path.join(rootDir, relativePath);

    if (entry.isDirectory()) {
      output.push(...collectFiles(rootDir, relativePath));
      continue;
    }

    const stats = fs.statSync(absolutePath);
    output.push({
      name: relativePath.replaceAll('\\\\', '/'),
      size: stats.size,
      ext: path.extname(entry.name).toLowerCase()
    });
  }

  return output;
};

const fileStats = collectFiles(distDir);

const jsChunks = fileStats
  .filter((file) => file.ext === '.js')
  .sort((a, b) => b.size - a.size);

if (jsChunks.length === 0) {
  console.error('[bundle-budget] No JS chunks found in build output.');
  process.exit(1);
}

const largestJsChunk = jsChunks[0];
const largestJsChunkKb = toKb(largestJsChunk.size);

const oversizedCriticalAssets = fileStats
  .filter((file) => mediaExtensions.has(file.ext))
  .filter((file) => !allowlist.has(file.name))
  .filter((file) => toKb(file.size) > maxCriticalAssetKb)
  .sort((a, b) => b.size - a.size);

let hasFailure = false;

console.log(`[bundle-budget] Largest JS chunk: ${largestJsChunk.name} (${largestJsChunkKb} KB)`);
if (largestJsChunkKb > maxJsKb) {
  console.error(
    `[bundle-budget] FAIL: largest JS chunk ${largestJsChunk.name} is ${largestJsChunkKb} KB (limit ${maxJsKb} KB).`
  );
  hasFailure = true;
}

if (oversizedCriticalAssets.length > 0) {
  console.error('[bundle-budget] FAIL: oversized critical-path assets detected:');
  for (const asset of oversizedCriticalAssets) {
    console.error(`  - ${asset.name}: ${toKb(asset.size)} KB (limit ${maxCriticalAssetKb} KB)`);
  }
  hasFailure = true;
}

if (!hasFailure) {
  console.log('[bundle-budget] PASS: budget checks are within limits.');
}

process.exit(hasFailure ? 1 : 0);
