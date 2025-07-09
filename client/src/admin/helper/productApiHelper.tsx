// Helper functions for product API operations with base64 image handling
import { API } from "../../backend";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export interface ProductImageData {
  data: string; // base64 string
  type: string; // mime type
  name: string; // file name
  isPrimary?: boolean;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: string;
  category: string;
  tags: string;
  productType: string;
  sizeStock: any;
  imageUrls?: any[];
  imageFiles?: ProductImageData[];
  primaryImageIndex?: number;
}

export const createProductWithImages = async (
  userId: string,
  token: string,
  productData: any,
  imageUrls: any[],
  imageFiles: { file: File; isPrimary: boolean }[]
): Promise<any> => {
  try {
    // Convert file images to base64
    const imageFilesData: ProductImageData[] = await Promise.all(
      imageFiles.map(async (img) => ({
        data: await fileToBase64(img.file),
        type: img.file.type,
        name: img.file.name,
        isPrimary: img.isPrimary
      }))
    );

    // Create payload
    const payload: CreateProductPayload = {
      ...productData,
      imageUrls: imageUrls,
      imageFiles: imageFilesData,
    };

    // Send as JSON
    const response = await fetch(`${API}/product/create-json/${userId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

export const updateProductWithImages = async (
  productId: string,
  userId: string,
  token: string,
  productData: any,
  existingImagesToKeep: number[],
  newImageUrls: any[],
  newImageFiles: { file: File; isPrimary: boolean }[]
): Promise<any> => {
  try {
    // Convert file images to base64
    const imageFilesData: ProductImageData[] = await Promise.all(
      newImageFiles.map(async (img) => ({
        data: await fileToBase64(img.file),
        type: img.file.type,
        name: img.file.name,
        isPrimary: img.isPrimary
      }))
    );

    // Create payload
    const payload = {
      ...productData,
      keepExistingImages: existingImagesToKeep,
      imageUrls: newImageUrls,
      imageFiles: imageFilesData,
    };

    // Send as JSON
    const response = await fetch(`${API}/product/update-json/${productId}/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};
