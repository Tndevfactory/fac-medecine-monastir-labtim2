// services/actusApi.ts
// This file centralizes API calls for Actualités (articles/events).

// Define the Actu type directly here or ensure it's imported from a common types file
export interface Actu {
  id: string;
  title: string;
  category: 'Formation' | 'Conférence' | 'Laboratoire';
  date: string; // YYYY-MM-DD
  image: string | null; // Image path from backend
  shortDescription: string;
  fullContent: string; // HTML content
  userId: string; // ID of the user who created it
  creatorName?: string; // Name of the creator (from User model include)
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

// Define common interfaces for API responses
interface SingleItemResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

interface ListItemsResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
  count?: number;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
}


/**
 * Utility function for making authenticated requests that can handle FormData.
 * This is crucial because when sending FormData, the 'Content-Type' header
 * must NOT be manually set to 'multipart/form-data'; the browser handles it,
 * including the boundary string.
 * Token is optional for public routes.
 * Returns a consistent { success, data, message } structure.
 */

const fetchWithAuth = async <T = any>(url: string, token: string | null = null, options?: RequestInit): Promise<T> => {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If the request body is FormData, ensure 'Content-Type' is not explicitly set.
  // Otherwise, set it to 'application/json' for JSON bodies.
  if (options?.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (options?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  let jsonResponse: any = {};
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      if (response.ok) {
        return { success: true, message: `Operation successful, but response JSON could not be parsed. Status: ${response.status}` } as T;
      }
      throw new Error(`Invalid JSON response from server: ${response.statusText || 'Unknown error'}`);
    }
  } else if (!response.ok) {
    throw new Error(response.statusText || `Request failed with status ${response.status}`);
  }
  if (response.ok && Object.keys(jsonResponse).length === 0 && response.status === 204) {
    return { success: true, message: "Operation successful, no content returned." } as T;
  }

  if (!response.ok) {
    const errorMessage = jsonResponse.message || response.statusText || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return jsonResponse as T;
};


/**
 * Fetches all actualités from the backend.
 * @param token The JWT token for authentication (optional for public routes).
 * @param category Optional: Filter actus by category.
 * @param searchTerm Optional: Filter actus by title or shortDescription.
 * @returns A promise that resolves to a ListItemsResponse containing an array of Actu objects.
 */
export const getAllActus = async (
  token: string | null = null,
  category?: string | null,
  searchTerm?: string
): Promise<ListItemsResponse<Actu>> => {
  try {
    const queryParams = new URLSearchParams();
    if (category) {
      queryParams.append('category', category);
    }
    if (searchTerm) {
      queryParams.append('searchTerm', searchTerm);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/actus${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[DEBUG - getAllActus API] Fetching URL: ${url}`);

    const responseData = await fetchWithAuth(url, token, { method: 'GET' });
    
    if (responseData.success && Array.isArray(responseData.data)) {
      return { success: true, data: responseData.data, message: responseData.message, count: responseData.count };
    } else {
      return { success: false, data: [], message: responseData.message || 'Failed to fetch actus or invalid data format.' };
    }
  } catch (error: any) {
    console.error('Error fetching all actus:', error);
    return { success: false, data: [], message: error.message || 'Network error.' };
  }
};

/**
 * Fetches a single actu by ID.
 * @param id The ID of the actu to fetch.
 * @param token The JWT token for authentication (optional for public routes).
 * @returns A promise that resolves to a SingleItemResponse containing the Actu object.
 */
export const getActuById = async (id: string, token: string | null = null): Promise<SingleItemResponse<Actu>> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/actus/${id}`, token, { method: 'GET' });
    if (responseData.success && responseData.data) {
      return { success: true, data: responseData.data, message: responseData.message };
    } else {
      return { success: false, data: null, message: responseData.message || 'Actu not found.' };
    }
  } catch (error: any) {
    console.error('Error fetching single actu:', error);
    return { success: false, data: null, message: error.message || 'Network error.' };
  }
};


/**
 * Creates a new actu.
 * @param actuData The FormData object containing actu data and optional image.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a SingleItemResponse containing the created Actu object.
 */
export const createActu = async (actuData: FormData, token: string): Promise<SingleItemResponse<Actu>> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/actus`, token, {
      method: 'POST',
      body: actuData,
    });
    if (responseData.success && responseData.data) {
      return { success: true, data: responseData.data, message: responseData.message };
    } else {
      return { success: false, data: null, message: responseData.message || 'Failed to create actu.' };
    }
  } catch (error: any) {
    console.error('Error creating actu:', error);
    return { success: false, data: null, message: error.message || 'Unknown error' };
  }
};

/**
 * Updates an existing actu by ID.
 * @param id The ID of the actu to update.
 * @param actuData The FormData object containing partial actu data and optional image.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a SingleItemResponse containing the updated Actu object.
 */
export const updateActu = async (id: string, actuData: FormData, token: string): Promise<SingleItemResponse<Actu>> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/actus/${id}`, token, {
      method: 'PUT',
      body: actuData,
    });
    if (responseData.success && responseData.data) {
      return { success: true, data: responseData.data, message: responseData.message };
    } else {
      return { success: false, data: null, message: responseData.message || 'Failed to update actu.' };
    }
  } catch (error: any) {
    console.error('Error updating actu:', error);
    return { success: false, data: null, message: error.message || 'Unknown error' };
  }
};

/**
 * Deletes an actu by ID.
 * @param id The ID of the actu to delete.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a DeleteResponse indicating success or failure.
 */
export const deleteActu = async (id: string, token: string): Promise<DeleteResponse> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/actus/${id}`, token, {
      method: 'DELETE',
    });
    if (responseData.success) {
      return { success: true, message: responseData.message || 'Actu deleted successfully.' };
    } else {
      return { success: false, message: responseData.message || 'Failed to delete actu.' };
    }
  } catch (error: any) {
    console.error('Error deleting actu:', error);
    return { success: false, message: error.message || 'Unknown error' };
  }
};
