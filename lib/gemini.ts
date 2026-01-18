import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

function getClient() {
    if (!genAI && API_KEY) {
        genAI = new GoogleGenAI({ apiKey: API_KEY });
    }
    return genAI;
}

// Avatar feature interface for DiceBear
interface AvatarFeatures {
    hairColor: string;
    skinColor: string;
    backgroundColor: string;
    accessories: string[];
    hairStyle: string;
    seed: string;
}

/**
 * Generate an avatar from a selfie using Gemini AI analysis + DiceBear
 * Step 1: Gemini analyzes the selfie to extract features
 * Step 2: Generate a DiceBear avatar with those features
 * 
 * @param selfieFile - The selfie image file
 * @returns URL of the generated avatar
 */
export async function generateAvatarFromSelfie(selfieFile: File): Promise<string | null> {
    const client = getClient();
    let features: AvatarFeatures;

    // Default features (fallback)
    const defaultFeatures: AvatarFeatures = {
        hairColor: '#2c1810',
        skinColor: '#f0c8a0',
        backgroundColor: getRandomColor(),
        accessories: [],
        hairStyle: 'short',
        seed: `user_${Date.now()}` // Unique seed ensures uniqueness
    };

    if (!client) {
        console.warn('Gemini API key not configured, using random avatar');
        console.warn('Please set VITE_GEMINI_API_KEY environment variable');
        // Even without API key, return a valid avatar
        return generateDiceBearUrl(defaultFeatures);
    }

    console.log('[AI Avatar] Starting selfie analysis...');
    console.log('[AI Avatar] File type:', selfieFile.type, 'Size:', selfieFile.size);

    try {
        const base64 = await fileToBase64(selfieFile);
        console.log('[AI Avatar] Base64 encoding complete, length:', base64.length);

        // Use stable Gemini model (1.5-flash is widely available)
        const response = await client.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: selfieFile.type || 'image/jpeg',
                                data: base64
                            }
                        },
                        {
                            text: `You are analyzing a selfie photo to create a cartoon avatar.

Look at the person in this photo and extract these features:
- Hair color (as a hex color code like #2c1810 for dark brown, #f5d142 for blonde)
- Skin tone (as a hex color like #f0c8a0 for light, #8d5524 for darker)
- A nice background color that would complement them (hex color)
- Whether they wear glasses (true/false)
- Hair style: "short", "long", "curly", or "bald"

IMPORTANT: Respond with ONLY a JSON object, no other text:
{"hairColor":"#hexcode","skinColor":"#hexcode","backgroundColor":"#hexcode","hasGlasses":false,"hairStyle":"short"}`
                        }
                    ]
                }
            ]
        });

        const responseText = response.text || '';
        console.log('[AI Avatar] Gemini raw response:', responseText);

        // Parse the JSON from the response
        try {
            // Try to extract JSON from the response (handle markdown code blocks)
            let jsonStr = responseText.trim();
            // Remove markdown code block if present
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
            }
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            console.log('[AI Avatar] Extracted JSON:', jsonStr);

            const parsed = JSON.parse(jsonStr);
            console.log('[AI Avatar] Parsed features:', parsed);

            features = {
                hairColor: parsed.hairColor || defaultFeatures.hairColor,
                skinColor: parsed.skinColor || defaultFeatures.skinColor,
                backgroundColor: parsed.backgroundColor || defaultFeatures.backgroundColor,
                accessories: parsed.hasGlasses ? ['glasses'] : [],
                hairStyle: parsed.hairStyle || defaultFeatures.hairStyle,
                seed: `ai_${Date.now()}`
            };
            console.log('[AI Avatar] SUCCESS: Using analyzed features');
        } catch (parseError) {
            console.error('[AI Avatar] JSON parse error:', parseError);
            console.error('[AI Avatar] Response was:', responseText);
            features = defaultFeatures;
        }

    } catch (error: any) {
        console.error('[AI Avatar] Gemini API call failed:', error?.message || error);
        console.error('[AI Avatar] Full error:', error);
        // If Gemini fails, we STILL return an avatar, just not personalized
        features = defaultFeatures;
    }

    // Generate DiceBear avatar URL with the extracted (or default) features
    const avatarUrl = generateDiceBearUrl(features);
    console.log('[AI Avatar] Final avatar URL:', avatarUrl);

    return avatarUrl;
}

function getRandomColor(): string {
    const colors = ['b6e3f4', 'ffd5dc', 'c0aede', 'd1f4d1', 'ffdfbf', 'ffeaa7', 'dfe6e9', 'fab1a0', 'a29bfe', '81ecec', 'fd79a8', '74b9ff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate a DiceBear avatar URL with custom features
 */
function generateDiceBearUrl(features: AvatarFeatures): string {
    // Use the 'adventurer' style which looks nice and supports customization
    const baseUrl = 'https://api.dicebear.com/7.x/adventurer/svg';

    // Map hair style to DiceBear options
    const hairStyleMap: Record<string, string> = {
        'short': 'short01,short02,short03,short04,short05',
        'long': 'long01,long02,long03,long04,long05,long06,long07,long08,long09,long10,long13,long14,long15,long16,long17,long18,long19,long20',
        'curly': 'long09,long10,long11,long12',
        'bald': 'short01'
    };

    // Build URL with parameters
    const params = new URLSearchParams({
        seed: features.seed,
        backgroundColor: features.backgroundColor.replace('#', ''),
        hairColor: features.hairColor.replace('#', ''),
        skinColor: features.skinColor.replace('#', ''),
        hair: hairStyleMap[features.hairStyle] || hairStyleMap['short']
    });

    // Add glasses if needed
    if (features.accessories.includes('glasses')) {
        params.set('glasses', 'variant01,variant02,variant03,variant04,variant05');
        params.set('glassesProbability', '100');
    }

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Alternative: Generate avatar using Imagen 3 directly
 * (Kept for reference but may not work on free tier)
 */
export async function generateAvatarWithImagen(selfieFile: File): Promise<string | null> {
    // This function requires paid API access to Imagen 3
    console.warn('Imagen 3 requires paid API access');
    return null;
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
