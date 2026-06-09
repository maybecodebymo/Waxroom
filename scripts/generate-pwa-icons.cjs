const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../Branding/wax logo only square.png');
const outDir = path.resolve(__dirname, '../public/pwa-icons');

fs.mkdirSync(outDir, { recursive: true });

const sizes = [192, 512, 180];
const bgColor = '#f5f5f3';

async function generate() {
  for (const size of sizes) {
    // Regular icon: logo centered on background
    await sharp(src)
      .resize(Math.round(size * 0.85), Math.round(size * 0.85), { fit: 'contain' })
      .extend({
        top: Math.round(size * 0.075),
        bottom: Math.round(size * 0.075),
        left: Math.round(size * 0.075),
        right: Math.round(size * 0.075),
        background: bgColor,
      })
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}.png`));

    // Maskable icon: logo fills safe area (80% inner)
    await sharp(src)
      .resize(Math.round(size * 0.8), Math.round(size * 0.8), { fit: 'contain' })
      .extend({
        top: Math.round(size * 0.1),
        bottom: Math.round(size * 0.1),
        left: Math.round(size * 0.1),
        right: Math.round(size * 0.1),
        background: bgColor,
      })
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}-maskable.png`));

    console.log(`Generated ${size}x${size} icons`);
  }
}

generate().catch(console.error);
