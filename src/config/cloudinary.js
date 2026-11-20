// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: 'dv4y7cdpi',
  uploadPreset: 'ev_rental_cars'
};

// URL để upload ảnh lên Cloudinary
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

// Upload ảnh (resourceType='image') hoặc video (resourceType='video') lên Cloudinary
export async function uploadToCloudinary(file, folder = 'profiles', resourceType = 'image') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('folder', folder);
  const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Trả về URL của ảnh
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

