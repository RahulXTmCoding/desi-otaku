import { API } from "../../backend";

// Create a design
export const createDesign = (userId: string, token: string, design: FormData) => {
  return fetch(`${API}/design/create/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: design,
  })
    .then((response) => {
      return response.json();
    })
};

// Get all designs (with pagination)
export const getDesigns = (page = 1, limit = 20, filters = {}) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  return fetch(`${API}/designs?${queryParams}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      // Handle both old (array) and new (paginated) response formats
      if (Array.isArray(data)) {
        // Old format - convert to paginated format
        return {
          designs: data,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalDesigns: data.length,
            hasMore: false
          }
        };
      }
      return data;
    })
};

// Get a single design
export const getDesign = (designId: string) => {
  return fetch(`${API}/design/${designId}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
};

// Update a design
export const updateDesign = (
  designId: string,
  userId: string,
  token: string,
  design: FormData
) => {
  return fetch(`${API}/design/${designId}/${userId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: design,
  })
    .then((response) => {
      return response.json();
    })
};

// Delete a design
export const deleteDesign = (designId: string, userId: string, token: string) => {
  return fetch(`${API}/design/${designId}/${userId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      return response.json();
    })
};

// Get popular designs
export const getPopularDesigns = (limit = 10) => {
  return fetch(`${API}/designs/popular?limit=${limit}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
};

// Get featured designs
export const getFeaturedDesigns = (limit = 8) => {
  return fetch(`${API}/designs/featured?limit=${limit}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
};

// Get designs by category
export const getDesignsByCategory = (category: string, limit = 20) => {
  return fetch(`${API}/designs/category/${category}?limit=${limit}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
};

// Get designs by tag
export const getDesignsByTag = (tag: string, limit = 20) => {
  return fetch(`${API}/designs/tag/${tag}?limit=${limit}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
};

// Get all tags
export const getAllDesignTags = () => {
  return fetch(`${API}/designs/tags`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
};

// Toggle like design
export const toggleLikeDesign = (designId: string, like: boolean) => {
  return fetch(`${API}/design/${designId}/like`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ like }),
  })
    .then((response) => {
      return response.json();
    })
};

// Get random design - OPTIMIZED for Surprise Me feature
export const getRandomDesign = () => {
  return fetch(`${API}/designs/random`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      return response.json();
    })
};

// Mock functions for test mode
export const mockCreateDesign = (design: FormData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDesign = {
        _id: Date.now().toString(),
        name: design.get('name'),
        category: design.get('category'),
        tags: design.get('tags')?.toString().split(',') || [],
        price: design.get('price'),
        isActive: true,
        isFeatured: false,
        popularity: { views: 0, likes: 0, used: 0 }
      };
      resolve(newDesign);
    }, 500);
  });
};

export const mockDeleteDesign = (designId: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: "Design deleted successfully" });
    }, 500);
  });
};

export const mockUpdateDesign = (designId: string, design: FormData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedDesign = {
        _id: designId,
        name: design.get('name'),
        category: design.get('category'),
        tags: design.get('tags')?.toString().split(',') || [],
        price: design.get('price'),
      };
      resolve(updatedDesign);
    }, 500);
  });
};
