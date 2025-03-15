import imageCompression from 'browser-image-compression';

export async function compressImage(imageFile: File): Promise<File> {
  try {
    // First, check if the file is an image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('The provided file is not an image');
    }

    // Set options for compression
    const options = {
      maxSizeMB: 1, // Maximum size in MB
      maxWidthOrHeight: 1080, // Maximum width or height
      useWebWorker: true,
      fileType: imageFile.type,
    };

    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);
    
    console.log(`Original size: ${imageFile.size / 1024 / 1024} MB`);
    console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}