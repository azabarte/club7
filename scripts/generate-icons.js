
import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../public/logo-base.jpg');
const DEST_DIR = path.join(__dirname, '../public'); // Ensure this matches where you want them

const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'maskable-icon.png', size: 512 }, // usually same as 512 but with padding, for now using same
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32x32.png', size: 32 }, // good for favicon
];

async function generate() {
    try {
        console.log(`Reading image from ${SOURCE}`);
        const image = await Jimp.read(SOURCE);

        for (const { name, size } of sizes) {
            const dest = path.join(DEST_DIR, name);
            const cloned = image.clone();
            // Resize to cover, focusing on center. Assuming square or near-square logo.
            // If the source is not square, we might want to 'contain' it or just resize.
            // The user provided a logo which looks like it might be portrait or need cropping.
            // We will perform a contain resize to be safe if aspect ratio differs,
            // or just resize if we assume it's good.
            // Let's us 'contain' to avoid stretching.
            // Actually, 'contain' needs a canvas. 'cover' crops.
            // Let's just resize for now, assuming the user provided a reasonable input.
            // Update: The input is 100KB jpg. 
            // Safe bet: resize.

            await cloned.resize({ w: size, h: size });
            await cloned.write(dest);
            console.log(`Generated ${name}`);
        }
    } catch (err) {
        console.error('Error generating icons:', err);
        process.exit(1);
    }
}

generate();
