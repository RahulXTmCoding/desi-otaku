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
  
  // Product images array (new multi-image system)
  if (product && product.images && product.images.length > 0) {
    const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
    if (primaryImage && primaryImage.url) {
      return primaryImage.url;
    }
    // If no URL, use the indexed endpoint
    const primaryIndex = product.images.findIndex((img: any) => img.isPrimary);
    const index = primaryIndex >= 0 ? primaryIndex : 0;
    return `${API}/product/image/${product._id}/${index}`;
  }
  
  // Product photoUrl (legacy support)
  if (product && product.photoUrl) return product.photoUrl;
  
  // API image endpoint fallback with index 0 for new system
  if (product && product._id) {
    return `${API}/product/image/${product._id}/0`;
  }
  
  // Default placeholder
  return '/placeholder.png';
};
