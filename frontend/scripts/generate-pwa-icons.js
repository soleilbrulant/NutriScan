const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const iconPath = path.join(__dirname, '../public/favicon.ico');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sizes.forEach(size => {
  sharp(iconPath)
    .resize(size, size)
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .catch(err => console.error(`Error generating ${size}x${size} icon:`, err));
}); 