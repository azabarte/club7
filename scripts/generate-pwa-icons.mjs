import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOGO_PATH = 'C:/Users/azaba/.gemini/antigravity/brain/3f37dd66-5844-41c1-8de4-282480ba6bf7/uploaded_image_1768820195102.jpg';
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

const ICONS = [
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'maskable-icon.png', size: 512 },
    { name: 'favicon-32x32.png', size: 32 }
];

async function generateIcons() {
    try {
        console.log('Loading logo from:', LOGO_PATH);
        const logo = await Jimp.read(LOGO_PATH);
        const width = logo.bitmap.width;
        const height = logo.bitmap.height;

        console.log(`Original size: ${width}x${height}`);

        // Crop to square (center)
        const minDim = Math.min(width, height);
        const x = Math.floor((width - minDim) / 2);
        const y = Math.floor((height - minDim) / 2);

        console.log(`Cropping to square: ${minDim}x${minDim} from (${x}, ${y})`);

        for (const icon of ICONS) {
            const clone = logo.clone();
            clone.crop({ x, y, w: minDim, h: minDim });
            clone.resize({ w: icon.size, h: icon.size });

            const outputPath = path.join(OUTPUT_DIR, icon.name);
            await clone.write(outputPath);
            console.log(`✓ Created: ${icon.name} (${icon.size}x${icon.size})`);
        }

        console.log('\n✅ All PWA icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
