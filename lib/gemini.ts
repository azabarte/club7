import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

function getClient() {
    if (!genAI && API_KEY) {
        genAI = new GoogleGenAI({ apiKey: API_KEY });
    }
    return genAI;
}

/**
 * Generate a cartoon avatar from a selfie using Gemini/Imagen
 * @param selfieFile - The selfie image file
 * @returns URL of the generated avatar (data URL)
 */
export async function generateAvatarFromSelfie(selfieFile: File): Promise<string | null> {
    const client = getClient();
    if (!client) {
        console.error('Gemini API key not configured');
        return null;
    }

    try {
        // Convert file to base64
        const base64 = await fileToBase64(selfieFile);

        // Use Gemini to generate avatar description, then Imagen to create it
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: selfieFile.type,
                                data: base64
                            }
                        },
                        {
                            text: `Based on this selfie, create a fun, colorful 3D cartoon avatar in the style of WhatsApp/Bitmoji avatars. 
              
              The avatar should:
              - Capture the person's key facial features (hair color, style, skin tone, eye color)
              - Be in a cute, friendly cartoon 3D style
              - Have a bright, colorful background
              - Look modern and polished like social media profile pictures
              - Be a head/shoulders portrait view
              
              Generate this avatar image.`
                        }
                    ]
                }
            ],
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT]
            }
        });

        // Extract the generated image
        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const imageData = part.inlineData.data;
                    return `data:${mimeType};base64,${imageData}`;
                }
            }
        }

        console.error('No image in response');
        return null;
    } catch (error) {
        console.error('Error generating avatar:', error);
        return null;
    }
}

/**
 * Alternative: Generate avatar using Imagen 3 directly
 */
export async function generateAvatarWithImagen(selfieFile: File): Promise<string | null> {
    const client = getClient();
    if (!client) {
        console.error('Gemini API key not configured');
        return null;
    }

    try {
        // First, get a description of the person from the selfie
        const base64 = await fileToBase64(selfieFile);

        const descriptionResponse = await client.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: selfieFile.type,
                                data: base64
                            }
                        },
                        {
                            text: `Describe this person's appearance briefly for creating an avatar: hair color/style, skin tone, eye color, any distinctive features. Be concise, 2-3 sentences max.`
                        }
                    ]
                }
            ]
        });

        const description = descriptionResponse.text || 'young person with friendly expression';

        // Then use Imagen to generate the avatar
        const imageResponse = await client.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `3D cartoon avatar portrait in WhatsApp/Bitmoji style of: ${description}. Cute friendly expression, vibrant colorful background, modern polished social media profile picture style.`,
            config: {
                numberOfImages: 1
            }
        });

        if (imageResponse.generatedImages && imageResponse.generatedImages[0]) {
            const image = imageResponse.generatedImages[0];
            if (image.image?.imageBytes) {
                return `data:image/png;base64,${image.image.imageBytes}`;
            }
        }

        return null;
    } catch (error) {
        console.error('Error generating avatar with Imagen:', error);
        return null;
    }
}

// Helper to convert File to base64
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix to get just the base64
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Check if API is configured
export function isGeminiConfigured(): boolean {
    return !!API_KEY;
}
