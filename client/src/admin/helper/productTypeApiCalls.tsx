import { API } from "../../backend";

// Get all product types
export const getAllProductTypes = async (active?: boolean) => {
  try {
    const url = active ? `${API}/producttypes?active=true` : `${API}/producttypes`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching product types:", err);
    return [];
  }
};

// Get product type by ID
export const getProductType = async (productTypeId: string) => {
  try {
    const response = await fetch(`${API}/producttype/${productTypeId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching product type:", err);
    return { error: "Failed to fetch product type" };
  }
};

// Create product type (admin)
export const createProductType = async (
  userId: string,
  token: string,
  productType: any
) => {
  try {
    const response = await fetch(`${API}/producttype/create/${userId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productType),
    });
    return await response.json();
  } catch (err) {
    console.error("Error creating product type:", err);
    return { error: "Failed to create product type" };
  }
};

// Update product type (admin)
export const updateProductType = async (
  productTypeId: string,
  userId: string,
  token: string,
  productType: any
) => {
  try {
    const response = await fetch(`${API}/producttype/${productTypeId}/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productType),
    });
    return await response.json();
  } catch (err) {
    console.error("Error updating product type:", err);
    return { error: "Failed to update product type" };
  }
};

// Delete product type (admin)
export const deleteProductType = async (
  productTypeId: string,
  userId: string,
  token: string
) => {
  try {
    const response = await fetch(`${API}/producttype/${productTypeId}/${userId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error deleting product type:", err);
    return { error: "Failed to delete product type" };
  }
};

// Update product type order (admin)
export const updateProductTypeOrder = async (
  userId: string,
  token: string,
  types: Array<{ _id: string; order: number }>
) => {
  try {
    const response = await fetch(`${API}/producttypes/order/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ types }),
    });
    return await response.json();
  } catch (err) {
    console.error("Error updating product type order:", err);
    return { error: "Failed to update order" };
  }
};
