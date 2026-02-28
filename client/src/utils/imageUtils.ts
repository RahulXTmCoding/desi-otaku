/**
 * Shared image resolution utility for cart / checkout / product items.
 * Handles the new multi-image system, legacy photoUrl, direct image URLs
 * and falls back to the API image endpoint.
 *
 * Usage:
 *   import { getCartItemImage } from '../utils/imageUtils';
 *   const src = getCartItemImage(item, isTestMode);
 */

import { getMockProductImage } from "../data/mockData";

const API = import.meta.env.VITE_API_URL;

/**
 * Convert an R2 image URL to a sized variant.
 *
 * The Cloudflare Worker on images.attars.club serves pre-generated
 * variants with a size suffix appended before the file extension:
 *   original.jpg → original-thumb.jpg  (~200 px, ~15 KB)
 *   original.jpg → original-medium.jpg (~500 px, ~80 KB)
 *   original.jpg → original-vsmall.jpg (~50 px,  ~3 KB)
 *
 * Non-R2 URLs and `original` size are returned as-is.
 */
export type ImageSize = "vsmall" | "thumb" | "medium" | "original";

export const convertImageUrl = (
  url: string,
  size: ImageSize = "original",
): string => {
  if (!url || size === "original") return url;
  // Only transform R2 CDN URLs
  if (!url.includes("images.attars.club")) return url;
  // Append size suffix before the file extension
  return url.replace(/(\.[^.]+)$/, `-${size}$1`);
};

/**
 * Returns the best available image URL for a cart/product line item.
 *
 * @param item        - Cart item or product object.
 * @param isTestMode  - When true, returns a mock placeholder image.
 */
export const getCartItemImage = (item: any, isTestMode = false): string => {
  if (isTestMode) {
    const id = item._id?.split("-")[0] || item.product || "";
    return getMockProductImage(id);
  }

  // Custom design items have no product image
  if (item.isCustom) return "";

  // ── New multi-image system ────────────────────────────────────────────────
  if (Array.isArray(item.images) && item.images.length > 0) {
    const primary =
      item.images.find((img: any) => img.isPrimary) || item.images[0];
    if (primary?.url) return primary.url;
  }

  // Nested product.images
  if (
    item.product &&
    typeof item.product === "object" &&
    Array.isArray(item.product.images) &&
    item.product.images.length > 0
  ) {
    const primary =
      item.product.images.find((img: any) => img.isPrimary) ||
      item.product.images[0];
    if (primary?.url) return primary.url;
  }

  // ── Legacy photoUrl ───────────────────────────────────────────────────────
  if (item.photoUrl) return item.photoUrl;

  // ── Direct image URL ──────────────────────────────────────────────────────
  if (item.image) {
    if (
      item.image.startsWith("http") ||
      item.image.startsWith("data:") ||
      item.image.startsWith("/api")
    ) {
      return item.image;
    }
  }

  // ── API image endpoint fallback ───────────────────────────────────────────
  const productId =
    (item.product && typeof item.product === "string" ? item.product : null) ||
    item.product?._id ||
    item._id;

  if (
    productId &&
    !String(productId).startsWith("temp_") &&
    !String(productId).startsWith("custom")
  ) {
    return `${API}/product/image/${productId}/0`;
  }

  return "/api/placeholder/80/80";
};
