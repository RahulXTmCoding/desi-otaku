import { API } from "../../backend";

// Get filtered products with pagination
export const getFilteredProducts = async (filters: {
  search?: string;
  category?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.productType && filters.productType !== 'all') queryParams.append('productType', filters.productType);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.tags && filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const response = await fetch(`${API}/products/filtered?${queryParams}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return response.json();
  } catch (err) {
    console.log(err);
    return { error: "Failed to fetch products" };
  }
};
