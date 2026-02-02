import { API } from "../../backend";

export interface SizeChartMeasurement {
  size: string;
  chest?: string;
  length?: string;
  shoulder?: string;
  sleeve?: string;
  bust?: string;
  waist?: string;
  hip?: string;
}

export interface SizeChartHeader {
  key: string;
  label: string;
}

export interface MeasurementGuide {
  part: string;
  instruction: string;
}

export interface SizeChartTemplate {
  _id: string;
  name: string;
  slug: string;
  displayTitle: string;
  description?: string;
  gender: 'men' | 'women' | 'unisex';
  headers: SizeChartHeader[];
  measurements: SizeChartMeasurement[];
  measurementGuide: MeasurementGuide[];
  note?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SizeChartDropdownItem {
  _id: string;
  name: string;
  displayTitle: string;
  gender: string;
}

// Get all size charts (with optional filters)
export const getAllSizeCharts = async (gender?: string, active?: boolean) => {
  try {
    const params = new URLSearchParams();
    if (gender) params.append('gender', gender);
    if (active) params.append('active', 'true');
    
    const url = params.toString() ? `${API}/sizecharts?${params}` : `${API}/sizecharts`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching size charts:", err);
    return [];
  }
};

// Get size charts for dropdown (simplified list)
export const getSizeChartsForDropdown = async (gender?: string) => {
  try {
    const params = new URLSearchParams();
    if (gender) params.append('gender', gender);
    
    const url = params.toString() ? `${API}/sizecharts/dropdown?${params}` : `${API}/sizecharts/dropdown`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching size charts for dropdown:", err);
    return [];
  }
};

// Get single size chart by ID
export const getSizeChartById = async (sizeChartId: string) => {
  try {
    const response = await fetch(`${API}/sizechart/${sizeChartId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching size chart:", err);
    return { error: "Failed to fetch size chart" };
  }
};

// Get size chart by slug
export const getSizeChartBySlug = async (slug: string) => {
  try {
    const response = await fetch(`${API}/sizechart/slug/${slug}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching size chart:", err);
    return { error: "Failed to fetch size chart" };
  }
};

// Create size chart (admin)
export const createSizeChart = async (
  userId: string,
  token: string,
  sizeChart: Partial<SizeChartTemplate>
) => {
  try {
    const response = await fetch(`${API}/sizechart/create/${userId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sizeChart),
    });
    return await response.json();
  } catch (err) {
    console.error("Error creating size chart:", err);
    return { error: "Failed to create size chart" };
  }
};

// Update size chart (admin)
export const updateSizeChart = async (
  sizeChartId: string,
  userId: string,
  token: string,
  sizeChart: Partial<SizeChartTemplate>
) => {
  try {
    const response = await fetch(`${API}/sizechart/${sizeChartId}/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sizeChart),
    });
    return await response.json();
  } catch (err) {
    console.error("Error updating size chart:", err);
    return { error: "Failed to update size chart" };
  }
};

// Delete size chart (admin)
export const deleteSizeChart = async (
  sizeChartId: string,
  userId: string,
  token: string
) => {
  try {
    const response = await fetch(`${API}/sizechart/${sizeChartId}/${userId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error deleting size chart:", err);
    return { error: "Failed to delete size chart" };
  }
};

// Toggle size chart status (admin)
export const toggleSizeChartStatus = async (
  sizeChartId: string,
  userId: string,
  token: string
) => {
  try {
    const response = await fetch(`${API}/sizechart/${sizeChartId}/toggle/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error toggling size chart status:", err);
    return { error: "Failed to toggle size chart status" };
  }
};
