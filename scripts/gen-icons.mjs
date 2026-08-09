import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const publicDir = path.join(root, 'public');
const iconsDir = path.join(publicDir, 'icons');

const svg = readFileSync(path.join(dir, 'icon-source.svg'));
const maskableSvg = readFileSync(path.join(dir, 'icon-maskable-source.svg'));

async function run() {
  await sharp(svg).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(svg).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(maskableSvg).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512-maskable.png'));
  await sharp(svg).resize(180, 180).flatten({ background: '#0f0f13' }).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Icons generated.');
}

run();
