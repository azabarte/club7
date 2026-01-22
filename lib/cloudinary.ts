export const uploadToCloudinary = async (
    file: File,
    folder: 'posts' | 'chat' | 'avatars' = 'posts'
): Promise<string | null> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        console.error('⚠️ Cloudinary credentials not found. Please check .env.local');
        alert('Faltan las credenciales de Cloudinary. Revisa la configuración.');
        return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `club7/${folder}`); // Organize in a folder

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloudinary Upload Error:', errorData);
            throw new Error(`Cloudinary Error: ${errorData.error.message}`);
        }

        const data = await response.json();
        // Return the secure URL (https)
        return data.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        alert('Error al subir el archivo. Inténtalo de nuevo.');
        return null;
    }
};

export const getOptimizedUrl = (url: string, width: number = 800): string => {
    if (!url.includes('cloudinary.com')) return url;

    // Check if it's already optimized/transformed to avoid duplication if called repeatedly
    // (Basic check, can be improved)
    if (url.includes('/q_auto,f_auto')) return url;

    // Insert transformations after /upload/
    // w_<width>: Resize
    // q_auto: Automatic quality optimization
    // f_auto: Automatic format selection (webp/avif)
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
};
