import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const svnAssetsDir = path.join(repoRoot, 'SVN', 'assets');
const websitePublicDir = path.resolve(scriptDir, '../public');

const mappings = [
  ['banner-1544x500.png', 'images/plugin-banner-1544x500.png'],
  ['banner-772x250.png', 'images/plugin-banner-772x250.png'],
  ['screenshot-1.png', 'images/plugin-screenshot-1.png'],
  ['screenshot-2.png', 'images/plugin-screenshot-2.png'],
  ['screenshot-3.png', 'images/plugin-screenshot-3.png'],
];

async function copyMappedAsset(sourceName, targetRelativePath) {
  const sourcePath = path.join(svnAssetsDir, sourceName);
  const targetPath = path.join(websitePublicDir, targetRelativePath);

  await fs.access(sourcePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function main() {
  for (const [sourceName, targetRelativePath] of mappings) {
    await copyMappedAsset(sourceName, targetRelativePath);
  }

  console.log('Synced plugin assets from SVN/assets to Website/public/images');
}

main().catch((error) => {
  console.error('Failed to sync plugin assets:', error);
  process.exit(1);
});
