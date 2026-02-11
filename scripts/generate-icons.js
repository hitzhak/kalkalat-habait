const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-maskable.png', size: 512, maskable: true },
  ];

  for (const icon of sizes) {
    const svgPath = path.join(iconsDir, icon.name.replace('.png', '.svg'));
    const pngPath = path.join(iconsDir, icon.name);

    if (fs.existsSync(svgPath)) {
      await sharp(svgPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(pngPath);
      console.log(`✓ Generated ${icon.name}`);
    } else {
      console.log(`⚠ SVG not found: ${svgPath}`);
    }
  }
}

generateIcons().catch(console.error);
