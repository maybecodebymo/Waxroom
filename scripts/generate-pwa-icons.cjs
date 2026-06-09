const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../Branding/wax logo only square.png');
const outDir = path.resolve(__dirname, '../public/pwa-icons');

fs.mkdirSync(outDir, { recursive: true });

const sizes = [180, 192, 512];
const bgColor = { r: 245, g: 245, b: 243, alpha: 1 };

async function generate() {
  for (const size of sizes) {
    const logoSize = Math.round(size * 0.85);
    const pad = Math.round((size - logoSize) / 2);

    // Regular icon
    await sharp(src)
      .resize(logoSize, logoSize, { fit: 'contain', background: bgColor })
      .flatten({ background: bgColor })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: bgColor })
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}.png`));

    // Maskable icon (logo fills 80% inner safe zone)
    const maskSize = Math.round(size * 0.8);
    const maskPad = Math.round((size - maskSize) / 2);

    await sharp(src)
      .resize(maskSize, maskSize, { fit: 'contain', background: bgColor })
      .flatten({ background: bgColor })
      .extend({ top: maskPad, bottom: maskPad, left: maskPad, right: maskPad, background: bgColor })
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}-maskable.png`));

    console.log(`Generated ${size}x${size} icons`);
  }
}

generate().catch(console.error);
