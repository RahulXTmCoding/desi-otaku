import { API } from "../../../../backend";

// Convert image URL to specific size (only for R2 URLs)
const convertImageUrl = (
  url: string,
  size: "vsmall" | "thumb" | "medium" | "original" = "thumb"
) => {
  if (size === "original" || !url) {
    return url;
  }

  // Only convert R2 URLs (images.attars.club)
  if (!url.startsWith("https://images.attars.club/")) {
    // External URL - return as-is
    return url;
  }

  // R2 URL - insert size suffix: xyz.jpg → xyz-thumb.jpg
  return url.replace(/(\.[^.]+)$/, `-${size}$1`);
};

export const getProductImageUrl = (item: any): string => {
  console.log(item);
  // Handle custom products - they don't have a product reference
  if (item.isCustom || !item.product) {
    // If it's a custom product, check for custom image
    if (item.image) return item.image;
    // Return placeholder for custom products without images
    return "/placeholder.png";
  }

  // Check if product is populated
  const product = item.product;

  // Product images array (new multi-image system) - PRIORITY
  if (product && product.images && product.images.length > 0) {
    const primaryImage =
      product.images.find((img: any) => img.isPrimary) || product.images[0];
    if (primaryImage && primaryImage.url) {
      return convertImageUrl(primaryImage.url, "thumb");
    }
  }

  // Direct image URL on the order item
  if (item.image) return item.image;

  // Product photoUrl (legacy support)
  if (product && product.photoUrl)
    return convertImageUrl(product.photoUrl, "thumb");

  // API image endpoint fallback (should rarely be used now)
  if (product && product._id) {
    return `${API}/product/image/${product._id}/0`;
  }

  // Default placeholder
  return "/placeholder.png";
};
