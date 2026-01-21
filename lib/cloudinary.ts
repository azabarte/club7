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
