import axios from 'axios';

/**
 * Uploads a compressed image blob directly to Cloudinary from the client browser.
 * Uses Cloudinary's Unsigned Upload Flow to securely upload without exposing account credentials.
 */
export async function uploadToCloudinary(blob: Blob): Promise<string> {
  const cloudinaryUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL;
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || 'collab_avatars';

  if (cloudinaryUrl) {
    const parts = cloudinaryUrl.split('@');
    if (parts.length > 1) {
      cloudName = parts[parts.length - 1].trim();
    }
  }

  if (!cloudName) {
    throw new Error(
      'Cloudinary is not configured. Please define NEXT_PUBLIC_CLOUDINARY_URL or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your apps/web/.env file.'
    );
  }

  const formData = new FormData();
  
  // Choose correct extension based on image blob type
  let extension = 'jpg';
  if (blob.type === 'image/avif') extension = 'avif';
  else if (blob.type === 'image/webp') extension = 'webp';

  formData.append('file', blob, `avatar.${extension}`);
  formData.append('upload_preset', uploadPreset);
  
  // We do not append api_key here because for client-side Unsigned uploads,
  // including api_key triggers Cloudinary's signed-signature validation, causing a 400 error.


  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data || !response.data.secure_url) {
      throw new Error('Failed to parse a valid URL from Cloudinary upload response');
    }

    return response.data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      const apiError = error.response.data.error?.message || JSON.stringify(error.response.data);
      throw new Error(`Cloudinary API Error: ${apiError}`);
    }
    throw new Error(error.message || 'Failed to upload image to Cloudinary');
  }
}
