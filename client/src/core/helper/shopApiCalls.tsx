import { API } from '../../backend';
export const getFilteredProducts = async (filters: {
  search?: string;
  category?: string;
  subcategory?: string;
  productType?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  availability?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
  excludeFeatured?: boolean;
}) => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.subcategory && filters.subcategory !== 'all') queryParams.append('subcategory', filters.subcategory);
    if (filters.productType && filters.productType !== 'all') queryParams.append('productType', filters.productType);
    if (filters.gender && filters.gender !== 'all') queryParams.append('gender', filters.gender);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.sizes && filters.sizes.length > 0) queryParams.append('sizes', filters.sizes.join(','));
    if (filters.availability) queryParams.append('availability', filters.availability);
    if (filters.tags && filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.excludeFeatured) queryParams.append('excludeFeatured', 'true');

    const response = await fetch(`${API}/products/filtered?${queryParams}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return response.json();
  } catch (err) {
    return { error: "Failed to fetch products" };
  }
};

export const getSimilarProducts = async (productId: string, limit: number = 4) => {
  try {
    const response = await fetch(`${API}/products/${productId}/similar?limit=${limit}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch similar products');
    }
    
    return data;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to fetch similar products' };
  }
};
