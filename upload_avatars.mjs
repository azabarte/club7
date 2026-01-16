// Script to upload avatars to Supabase Storage
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://pcsldzghnavudueejecq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjc2xkemdobmF2dWR1ZWVqZWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDM0ODksImV4cCI6MjA4NDA3OTQ4OX0.xZKJoCoK5ObJ8cvVMifAusFJeCU8jymCQCI_5-stv40';

const supabase = createClient(supabaseUrl, supabaseKey);

const avatars = [
    { name: 'javier', file: 'C:/Users/azaba/.gemini/antigravity/brain/1f8affe4-04f9-42ef-ad04-8c1b966f0689/avatar_javier_1768593165121.png' },
    { name: 'sofia', file: 'C:/Users/azaba/.gemini/antigravity/brain/1f8affe4-04f9-42ef-ad04-8c1b966f0689/avatar_sofia_1768593179867.png' },
    { name: 'daniela', file: 'C:/Users/azaba/.gemini/antigravity/brain/1f8affe4-04f9-42ef-ad04-8c1b966f0689/avatar_daniela_1768593194866.png' },
    { name: 'carolina', file: 'C:/Users/azaba/.gemini/antigravity/brain/1f8affe4-04f9-42ef-ad04-8c1b966f0689/avatar_carolina_1768593208774.png' },
    { name: 'andrea', file: 'C:/Users/azaba/.gemini/antigravity/brain/1f8affe4-04f9-42ef-ad04-8c1b966f0689/avatar_andrea_1768593221740.png' },
];

async function uploadAvatars() {
    const urls = {};

    for (const avatar of avatars) {
        const fileBuffer = fs.readFileSync(avatar.file);
        const fileName = `avatars/${avatar.name}.png`;

        const { data, error } = await supabase.storage
            .from('club7-media')
            .upload(fileName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error(`Error uploading ${avatar.name}:`, error.message);
        } else {
            const { data: urlData } = supabase.storage
                .from('club7-media')
                .getPublicUrl(fileName);
            urls[avatar.name] = urlData.publicUrl;
            console.log(`${avatar.name}: ${urlData.publicUrl}`);
        }
    }

    console.log('\n--- UPDATE SQL ---');
    console.log(`UPDATE club_members SET avatar_url = '${urls.javier}' WHERE name = 'Javier';`);
    console.log(`UPDATE club_members SET avatar_url = '${urls.sofia}' WHERE name = 'Sofía';`);
    console.log(`UPDATE club_members SET avatar_url = '${urls.daniela}' WHERE name = 'Daniela';`);
    console.log(`UPDATE club_members SET avatar_url = '${urls.carolina}' WHERE name = 'Carolina';`);
    console.log(`UPDATE club_members SET avatar_url = '${urls.andrea}' WHERE name = 'Andrea';`);
}

uploadAvatars();
