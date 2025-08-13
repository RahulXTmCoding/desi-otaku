import { API } from "../../backend";

// Get all products
export const getProducts = () => {
  return fetch(`${API}/products`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get a single product
export const getProduct = (productId: string) => {
  return fetch(`${API}/product/${productId}`, { method: "GET" })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      return response.json();
    });
};

// Get all categories
export const getCategories = () => {
  return fetch(`${API}/categories`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get products by category
export const getProductsByCategory = (categoryId: string) => {
  return fetch(`${API}/products/category/${categoryId}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Search products
export const searchProducts = (searchTerm: string) => {
  return fetch(`${API}/products/search?q=${searchTerm}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get main categories only (no subcategories)
export const getMainCategories = () => {
  return fetch(`${API}/categories/main`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get subcategories for a parent category
export const getSubcategories = (parentId: string) => {
  return fetch(`${API}/categories/subcategories/${parentId}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get category hierarchy (category with its subcategories)
export const getCategoryHierarchy = (categoryId: string) => {
  return fetch(`${API}/categories/hierarchy/${categoryId}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get all categories in tree structure
export const getCategoryTree = () => {
  return fetch(`${API}/categories/tree`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get all product types
export const getProductTypes = () => {
  return fetch(`${API}/producttypes`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};
