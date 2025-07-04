import { API } from '../../../../backend';

export const getProductImageUrl = (item: any): string => {
  // Handle custom products - they don't have a product reference
  if (item.isCustom || !item.product) {
    // If it's a custom product, check for custom image
    if (item.image) return item.image;
    // Return placeholder for custom products without images
    return '/placeholder.png';
  }
  
  // Check if product is populated
  const product = item.product;
  
  // Direct image URL on the order item
  if (item.image) return item.image;
  
  // Product photoUrl (most common for Zoro tshirt)
  if (product && product.photoUrl) return product.photoUrl;
  
  // Product images array
  if (product && product.images && product.images.length > 0) {
    const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
    return primaryImage.url;
  }
  
  // API photo endpoint fallback
  if (product && product._id) {
    return `${API}/product/photo/${product._id}`;
  }
  
  // Default placeholder
  return '/placeholder.png';
};
