// Utility to compress images before converting to base64

export const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to blob conversion failed'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
  });
};

export const compressMultipleImages = async (files: File[], maxWidth?: number, maxHeight?: number, quality?: number): Promise<File[]> => {
  const compressionPromises = files.map(file => compressImage(file, maxWidth, maxHeight, quality));
  return Promise.all(compressionPromises);
};
