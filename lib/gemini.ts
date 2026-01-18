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
    if (!client) {
        console.error('Gemini API key not configured');
        return null;
    }

    try {
        const base64 = await fileToBase64(selfieFile);

        // Use Gemini to analyze the selfie and get structured features
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
                            text: `Analyze this selfie and extract features for creating a cartoon avatar. 
                            
Respond ONLY with a JSON object in this exact format (no other text):
{
    "hairColor": "hex color like #2c1810 or #f5d142",
    "skinColor": "hex color for skin tone like #f0c8a0 or #8d5524",
    "backgroundColor": "hex color that would complement the person like #a78bfa or #f472b6",
    "hasGlasses": true or false,
    "hairStyle": "short" or "long" or "curly" or "bald",
    "gender": "male" or "female"
}`
                        }
                    ]
                }
            ]
        });

        const responseText = response.text || '';
        console.log('Gemini response:', responseText);

        // Parse the JSON from the response
        let features: AvatarFeatures;
        try {
            // Try to extract JSON from the response (handle markdown code blocks)
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonStr);

            features = {
                hairColor: parsed.hairColor || '#2c1810',
                skinColor: parsed.skinColor || '#f0c8a0',
                backgroundColor: parsed.backgroundColor || '#a78bfa',
                accessories: parsed.hasGlasses ? ['glasses'] : [],
                hairStyle: parsed.hairStyle || 'short',
                seed: `user_${Date.now()}`
            };
        } catch (parseError) {
            console.error('Error parsing Gemini response, using defaults:', parseError);
            // Use random defaults if parsing fails
            features = {
                hairColor: '#2c1810',
                skinColor: '#f0c8a0',
                backgroundColor: '#a78bfa',
                accessories: [],
                hairStyle: 'short',
                seed: `user_${Date.now()}`
            };
        }

        // Generate DiceBear avatar URL with the extracted features
        const avatarUrl = generateDiceBearUrl(features);
        console.log('Generated DiceBear avatar URL:', avatarUrl);

        return avatarUrl;
    } catch (error) {
        console.error('Error generating avatar:', error);
        return null;
    }
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
