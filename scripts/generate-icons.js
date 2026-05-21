const sharp = require('sharp');
const path = require('path');

const logoPath = path.join(__dirname, '../public/Logo.png');

async function generateIcon(size, outputName) {
  const outputPath = path.join(__dirname, '../public', outputName);
  
  // Logo size should take up 60% of the target icon size
  const logoSize = Math.round(size * 0.6);
  
  // Resize the transparent logo to fit inside the 60% bounding box
  const resizedLogoBuffer = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
    
  // Create a solid cream background (#F8F4F0)
  // Hex #F8F4F0 in RGB: R=248, G=244, B=240
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 248, g: 244, b: 240, alpha: 1 }
    }
  })
  .composite([
    {
      input: resizedLogoBuffer,
      gravity: 'center'
    }
  ])
  .png()
  .toFile(outputPath);
  
  console.log(`Successfully generated ${outputName} (${size}x${size}px) with 60% logo area and cream background.`);
}

async function main() {
  console.log('Generating custom PWA icons...');
  try {
    await generateIcon(192, 'icon-192.png');
    await generateIcon(512, 'icon-512.png');
    await generateIcon(180, 'apple-touch-icon.png');
    console.log('All icons generated successfully inside /public!');
  } catch (error) {
    console.error('Error generating custom icons:', error);
    process.exit(1);
  }
}

main();
