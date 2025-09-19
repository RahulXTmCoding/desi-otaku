import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSimilarProducts, getFilteredProducts } from '../core/helper/shopApiCalls';
import { getProducts, getProduct } from '../core/helper/coreapicalls';
import { getDesigns, getAllDesignTags } from '../admin/helper/designapicall';
import { getCategories } from '../admin/helper/adminapicall';
import { API } from '../backend';
import { queryPersistence } from '../utils/queryPersistence';

// Interface for filtered products parameters
interface FilteredProductsParams {
  search?: string;
  category?: string;
  subcategory?: string;
  productType?: string;
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
}

// Hook for fetching similar products with caching
export const useSimilarProducts = (productId: string, limit: number = 4) => {
  return useQuery({
    queryKey: ['similarProducts', productId, limit],
    queryFn: () => getSimilarProducts(productId, limit),
    enabled: !!productId, // Only run if productId exists
    staleTime: 1 * 60 * 1000, // 1 minute (short TTL for fresh recommendations) 
    gcTime: 5 * 60 * 1000, // 5 minutes max cache as requested
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching all products with caching (optimized for home page)
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      
      try {
        const data = await getProducts();
        return data;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (home page cache)
    gcTime: 5 * 60 * 1000, // 5 minutes max cache as requested
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Use cached data while fetching fresh in background
    placeholderData: (previousData) => {
      if (previousData && import.meta.env.DEV) {
      }
      return previousData;
    },
    // Better structural sharing for product lists
    structuralSharing: true,
    // Add meta for debugging
    meta: {
      hookType: 'useProducts',
      purpose: 'homePage'
    }
  });
};

// Hook for fetching single product with caching
export const useProduct = (productId: string) => {
  const queryKey = ['product', productId];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      
      try {
        const data = await getProduct(productId);
        // Check if product is newly launched (within last 7 days)
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const isNewlyLaunched = daysSinceCreation <= 7;
        
        
        return data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!productId,
    // Use moderate cache times that work for both new and old products
    staleTime: 5 * 60 * 1000, // 5 minutes (balanced for all products)
    gcTime: 10 * 60 * 1000, // 10 minutes max cache (meets requirement)
    retry: 2,
    // Prevent unnecessary refetches but allow initial fetch
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Use cached data if available while fetching fresh in background
    placeholderData: (previousData) => {
      if (previousData && import.meta.env.DEV) {
      }
      return previousData;
    },
    // Use initial data from persistence if available
    initialData: () => {
      // Check if we have persisted data
      const persistedCache = localStorage.getItem('react-query-cache');
      if (persistedCache) {
        try {
          const cache = JSON.parse(persistedCache);
          const queryHash = JSON.stringify(queryKey);
          
          // Look for our specific query in the persisted cache
          if (cache.clientState && cache.clientState.queries) {
            for (const query of cache.clientState.queries) {
              if (JSON.stringify(query.queryKey) === queryHash && query.state.data) {
                const cacheAge = Date.now() - query.state.dataUpdatedAt;
                if (cacheAge < 30 * 60 * 1000) { // Within 30 minutes
                  return query.state.data;
                }
              }
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) {
          }
        }
      }
      return undefined;
    },
    // Prevent network requests if data is fresh
    networkMode: 'online',
    // Better structural sharing
    structuralSharing: true,
    // Add meta for debugging
    meta: {
      productId,
      hookType: 'useProduct'
    }
  });
};

// Hook for fetching filtered products with comprehensive caching
export const useFilteredProducts = (params: FilteredProductsParams) => {
  // Create a stable cache key by normalizing the parameters
  const createCacheKey = (params: FilteredProductsParams) => {
    // Sort arrays for consistent cache keys
    const sortedSizes = params.sizes ? [...params.sizes].sort() : undefined;
    const sortedTags = params.tags ? [...params.tags].sort() : undefined;
    
    // Clean up undefined/null values and create normalized params
    const normalizedParams = {
      search: params.search || undefined,
      category: params.category === 'all' ? undefined : params.category,
      subcategory: params.subcategory === 'all' ? undefined : params.subcategory,
      productType: params.productType === 'all' ? undefined : params.productType,
      minPrice: params.minPrice || 0,
      maxPrice: params.maxPrice || 5000,
      sizes: sortedSizes?.length ? sortedSizes : undefined,
      availability: params.availability === 'all' ? undefined : params.availability,
      tags: sortedTags?.length ? sortedTags : undefined,
      sortBy: params.sortBy || 'newest',
      sortOrder: params.sortOrder || 'desc',
      page: params.page || 1,
      limit: params.limit || 12,
      excludeFeatured: params.excludeFeatured || undefined
    };

    // Remove undefined values for cleaner cache key
    const cleanParams = Object.fromEntries(
      Object.entries(normalizedParams).filter(([_, value]) => value !== undefined)
    );

    return ['filteredProducts', cleanParams];
  };

  return useQuery({
    queryKey: createCacheKey(params),
    queryFn: () => getFilteredProducts(params),
    staleTime: 3 * 60 * 1000, // 3 minutes (shop data changes more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes max cache
    retry: 2,
    refetchOnWindowFocus: false,
    // Enable background refetch to keep data fresh
    refetchOnReconnect: true,
  });
};

// Hook for prefetching similar products (preload before user needs them)
export const usePrefetchSimilarProducts = () => {
  const queryClient = useQueryClient();
  
  const prefetchSimilarProducts = (productId: string, limit: number = 4) => {
    queryClient.prefetchQuery({
      queryKey: ['similarProducts', productId, limit],
      queryFn: () => getSimilarProducts(productId, limit),
      staleTime: 10 * 60 * 1000,
    });
  };

  return prefetchSimilarProducts;
};

// Hook for prefetching filtered products (useful for predicted user navigation)
export const usePrefetchFilteredProducts = () => {
  const queryClient = useQueryClient();
  
  const prefetchFilteredProducts = (params: FilteredProductsParams) => {
    const createCacheKey = (params: FilteredProductsParams) => {
      const sortedSizes = params.sizes ? [...params.sizes].sort() : undefined;
      const sortedTags = params.tags ? [...params.tags].sort() : undefined;
      
      const normalizedParams = {
        search: params.search || undefined,
        category: params.category === 'all' ? undefined : params.category,
        subcategory: params.subcategory === 'all' ? undefined : params.subcategory,
        productType: params.productType === 'all' ? undefined : params.productType,
        minPrice: params.minPrice || 0,
        maxPrice: params.maxPrice || 5000,
        sizes: sortedSizes?.length ? sortedSizes : undefined,
        availability: params.availability === 'all' ? undefined : params.availability,
        tags: sortedTags?.length ? sortedTags : undefined,
        sortBy: params.sortBy || 'newest',
        sortOrder: params.sortOrder || 'desc',
        page: params.page || 1,
        limit: params.limit || 12,
        excludeFeatured: params.excludeFeatured || undefined
      };

      const cleanParams = Object.fromEntries(
        Object.entries(normalizedParams).filter(([_, value]) => value !== undefined)
      );

      return ['filteredProducts', cleanParams];
    };

    queryClient.prefetchQuery({
      queryKey: createCacheKey(params),
      queryFn: () => getFilteredProducts(params),
      staleTime: 3 * 60 * 1000,
    });
  };

  return prefetchFilteredProducts;
};

// Interface for design filter parameters
interface DesignFilterParams {
  search?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

// Hook for fetching filtered designs with caching (longer TTL since designs change less frequently)
export const useDesigns = (params: DesignFilterParams) => {
  // Create a stable cache key by normalizing the parameters
  const createCacheKey = (params: DesignFilterParams) => {
    const normalizedParams = {
      search: params.search || undefined,
      category: params.category === 'all' ? undefined : params.category,
      tag: params.tag || undefined,
      page: params.page || 1,
      limit: params.limit || 50
    };

    // Remove undefined values for cleaner cache key
    const cleanParams = Object.fromEntries(
      Object.entries(normalizedParams).filter(([_, value]) => value !== undefined)
    );

    return ['designs', cleanParams];
  };

  return useQuery({
    queryKey: createCacheKey(params),
    queryFn: () => {
      const filters: any = {};
      if (params.search) filters.search = params.search;
      if (params.category && params.category !== 'all') filters.category = params.category;
      if (params.tag) filters.tag = params.tag;
      return getDesigns(params.page || 1, params.limit || 50, filters);
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (faster updates for designs)
    gcTime: 5 * 60 * 1000, // 5 minutes max cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

// Hook for fetching design categories with caching
export const useDesignCategories = () => {
  return useQuery({
    queryKey: ['designCategories'],
    queryFn: getCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes (categories change rarely)
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching design tags with caching
export const useDesignTags = () => {
  return useQuery({
    queryKey: ['designTags'],
    queryFn: getAllDesignTags,
    staleTime: 15 * 60 * 1000, // 15 minutes (tags change rarely)
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching product reviews with caching (longer TTL since reviews don't change frequently)
export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['productReviews', productId],
    queryFn: async () => {
      const response = await fetch(`${API}/reviews/product/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    },
    enabled: !!productId,
    staleTime: 15 * 60 * 1000, // 15 minutes (reviews don't change frequently)
    gcTime: 45 * 60 * 1000, // 45 minutes in cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching user's review for a specific product
export const useUserReview = (productId: string, userId: string, token: string) => {
  return useQuery({
    queryKey: ['userReview', productId, userId],
    queryFn: async () => {
      if (!userId || !token) return null;
      
      const response = await fetch(`${API}/reviews/product/${productId}/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 404) {
        return null; // User hasn't reviewed this product
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch user review');
      }
      
      return response.json();
    },
    enabled: !!productId && !!userId && !!token,
    staleTime: 20 * 60 * 1000, // 20 minutes (user's own review changes rarely)
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching reviews settings (whether reviews are enabled)
export const useReviewsSettings = () => {
  return useQuery({
    queryKey: ['reviewsSettings'],
    queryFn: async () => {
      const response = await fetch(`${API}/settings/reviews-status`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews settings');
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (settings change very rarely)
    gcTime: 120 * 60 * 1000, // 2 hours in cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for caching product images with React Query (NON-BLOCKING)
export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['productImages', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID required');
      
      // Fetch product data first to get image info
      const productResponse = await fetch(`${API}/product/${productId}`);
      if (!productResponse.ok) {
        throw new Error('Failed to fetch product');
      }
      const product = await productResponse.json();
      
      // Build image array
      const images = [];
      
      if (product.images && product.images.length > 0) {
        // Process multiple images
        product.images.forEach((img: any, index: number) => {
          images.push({
            id: `${productId}-${index}`,
            url: img.url || `${API}/product/image/${productId}/${index}`,
            caption: img.caption || `Image ${index + 1}`,
            isPrimary: img.isPrimary || false,
            order: img.order || index
          });
        });
        
        // Sort by order
        images.sort((a, b) => a.order - b.order);
        
        // Ensure at least one image is primary
        if (!images.some(img => img.isPrimary) && images.length > 0) {
          images[0].isPrimary = true;
        }
      } else {
        // Single image fallback
        images.push({
          id: `${productId}-0`,
          url: `${API}/product/image/${productId}`,
          caption: 'Main Image',
          isPrimary: true,
          order: 0
        });
      }
      
      // Return images immediately - preload in background after return
      setTimeout(() => {
        images.forEach(image => {
          const img = new Image();
          img.src = image.url; // Preload in background without blocking
        });
      }, 0);
      
      return images;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes (images don't change frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes in cache (longer for images)
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached images first
  });
};

// Hook for prefetching product images (use when hovering over product cards)
export const usePrefetchProductImages = () => {
  const queryClient = useQueryClient();
  
  const prefetchProductImages = (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['productImages', productId],
      queryFn: async () => {
        if (!productId) throw new Error('Product ID required');
        
        const productResponse = await fetch(`${API}/product/${productId}`);
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }
        const product = await productResponse.json();
        
        const images = [];
        
        if (product.images && product.images.length > 0) {
          product.images.forEach((img: any, index: number) => {
            images.push({
              id: `${productId}-${index}`,
              url: img.url || `${API}/product/image/${productId}/${index}`,
              caption: img.caption || `Image ${index + 1}`,
              isPrimary: img.isPrimary || false,
              order: img.order || index
            });
          });
          
          images.sort((a, b) => a.order - b.order);
          
          if (!images.some(img => img.isPrimary) && images.length > 0) {
            images[0].isPrimary = true;
          }
        } else {
          images.push({
            id: `${productId}-0`,
            url: `${API}/product/image/${productId}`,
            caption: 'Main Image',
            isPrimary: true,
            order: 0
          });
        }
        
        // Preload images
        await Promise.all(
          images.map(image => 
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(image);
              img.onerror = () => resolve(image);
              img.src = image.url;
            })
          )
        );
        
        return images;
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  return prefetchProductImages;
};

// Hook for fetching featured products with React Query caching
export const useFeaturedProducts = (limit: number = 8) => {
  return useQuery({
    queryKey: ['featuredProducts', limit],
    queryFn: async () => {
      if (import.meta.env.DEV) {
      }
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${API}/products/featured?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        const data = await response.json();
        const endTime = Date.now();
        
        if (import.meta.env.DEV) {
        }
        
        return data.products || [];
      } catch (error) {
        const endTime = Date.now();
        if (import.meta.env.DEV) {
        }
        // Return empty array instead of throwing to gracefully handle no featured products
        return [];
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (featured products should stay fresh)
    gcTime: 10 * 60 * 1000, // 10 minutes max cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Use cached data while fetching fresh in background
    placeholderData: (previousData) => {
      if (previousData && import.meta.env.DEV) {
      }
      return previousData;
    },
    // Better structural sharing for featured product lists
    structuralSharing: true,
    // Add meta for debugging
    meta: {
      hookType: 'useFeaturedProducts',
      purpose: 'homePageFeatured',
      limit
    }
  });
};

// Hook for fetching trending products with React Query caching
export const useTrendingProducts = (limit: number = 8) => {
  return useQuery({
    queryKey: ['trendingProducts', limit],
    queryFn: async () => {
      if (import.meta.env.DEV) {
      }
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${API}/products/trending?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trending products');
        }
        const data = await response.json();
        const endTime = Date.now();
        
        if (import.meta.env.DEV) {
        }
        
        return data.products || [];
      } catch (error) {
        const endTime = Date.now();
        if (import.meta.env.DEV) {
        }
        // Return empty array instead of throwing to gracefully handle no trending products
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (trending changes more frequently)
    gcTime: 8 * 60 * 1000, // 8 minutes max cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Use cached data while fetching fresh in background
    placeholderData: (previousData) => {
      if (previousData && import.meta.env.DEV) {
      }
      return previousData;
    },
    // Better structural sharing for trending product lists
    structuralSharing: true,
    // Add meta for debugging
    meta: {
      hookType: 'useTrendingProducts',
      purpose: 'homePageTrending',
      limit
    }
  });
};
