// services/masterSIApi.ts

import { MasterSI } from '@/types/index';

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
 * Utility function for making authenticated requests.
 * Handles JSON body.
 * Returns the raw JSON response from the backend (which includes success/data properties).
 * MODIFIED: Token is now optional.
 */
const fetchWithAuth = async (url: string, token: string | null = null, options?: RequestInit) => { // token is now optional
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) { // Only add Authorization header if token is provided
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  let jsonResponse: any = {};
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      console.error('Failed to parse error response as JSON:', parseError);
      // If parsing fails, but response is OK, return a generic success with a warning
      if (response.ok) {
        return { success: true, message: `Operation successful, but response JSON could not be parsed. Status: ${response.status}` };
      }
      throw new Error(`Invalid JSON response from server: ${response.statusText || 'Unknown error'}`);
    }
  } else if (!response.ok) {
      // If not JSON and not OK, throw error with status text
      throw new Error(response.statusText || `Request failed with status ${response.status}`);
  }
  // If response.ok is true and it's not JSON, or 204, return a default success.
  if (response.ok && Object.keys(jsonResponse).length === 0 && response.status === 204) {
      return { success: true, message: "Operation successful, no content returned." };
  }

  // If response is not OK (e.g., 4xx, 5xx), even if JSON was parsed, throw an error
  if (!response.ok) {
    const errorMessage = jsonResponse.message || response.statusText || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // Return the full JSON response, e.g., { success: true, data: {...} }
  return jsonResponse;
};

/**
 * Fetches all Master SIs.
 * @param token The JWT token for authentication (optional for public access).
 * @param creatorId Optional: If provided, fetches Master SIs by this creator ID.
 * @param year Optional: Filter Master SIs by year.
 * @param type Optional: Filter Master SIs by type.
 * @param searchTerm Optional: Filter Master SIs by title, author, etc.
 * @returns A promise that resolves to a ListItemsResponse containing an array of Master SIs.
 */
export const getAllMasterSIs = async (
  token: string | null = null, // token is now optional
  creatorId?: string,
  year?: number | null, // Added year parameter
  type?: string | null, // Added type parameter
  searchTerm?: string // Added searchTerm parameter
): Promise<ListItemsResponse<MasterSI>> => {
  try {
    const queryParams = new URLSearchParams();
    if (creatorId) {
      queryParams.append('creatorId', creatorId);
    }
    if (year) {
      queryParams.append('year', year.toString());
    }
    if (type) {
      queryParams.append('type', type);
    }
    if (searchTerm) {
      queryParams.append('searchTerm', searchTerm);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/mastersis${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[DEBUG - getAllMasterSIs API] Fetching URL: ${url}`); // Added debug log

    // Pass token (which might be null) to fetchWithAuth
    const responseData = await fetchWithAuth(url, token, { method: 'GET' });
    
    if (responseData.success && Array.isArray(responseData.data)) {
      return { success: true, data: responseData.data, message: responseData.message, count: responseData.count };
    } else {
      return { success: false, data: [], message: responseData.message || 'Failed to fetch Master SIs or invalid data format.' };
    }
  } catch (error: any) {
    console.error('Error fetching Master SIs:', error);
    return { success: false, data: [], message: error.message || 'Network error.' };
  }
};

/**
 * Fetches a single Master SI by ID.
 * @param id The ID of the Master SI to fetch.
 * @param token The JWT token for authentication (optional, as this route is public).
 * @returns A promise that resolves to a SingleItemResponse containing the Master SI data or null if not found.
 */
export const getMasterSIById = async (id: string, token: string | null = null): Promise<SingleItemResponse<MasterSI>> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/mastersis/${id}`, token, { method: 'GET' });

    if (responseData.success && responseData.data) {
        return { success: true, data: responseData.data, message: responseData.message };
    } else {
        return { success: false, data: null, message: responseData.message || 'Master SI not found.' };
    }
  } catch (error: any) {
    console.error(`Error fetching Master SI with ID ${id}:`, error);
    return { success: false, data: null, message: error.message || 'Network error.' };
  }
};


/**
 * Creates a new Master SI.
 * @param masterSIData The data for the new Master SI.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a SingleItemResponse containing the created Master SI.
 */
export const createMasterSI = async (masterSIData: Omit<MasterSI, 'id' | 'createdAt' | 'updatedAt' | 'creatorName' | 'creatorEmail'>, token: string): Promise<SingleItemResponse<MasterSI>> => {
    try {
        const payload: any = { ...masterSIData };
        if (payload.membres !== undefined && Array.isArray(payload.membres)) {
            payload.membres = JSON.stringify(payload.membres);
        }

        const responseData = await fetchWithAuth(`${API_BASE_URL}/mastersis`, token, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (responseData.success && responseData.data) {
            return { success: true, data: responseData.data, message: responseData.message };
        } else {
            return { success: false, data: null, message: responseData.message || 'Failed to create Master SI.' };
        }
    } catch (error: any) {
        console.error('Error creating Master SI:', error);
        return { success: false, data: null, message: error.message || 'Unknown error' };
    }
};

/**
 * Updates an existing Master SI.
 * @param id The ID of the Master SI to update.
 * @param masterSIData The updated data for the Master SI.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a SingleItemResponse containing the updated Master SI.
 */
export const updateMasterSI = async (id: string, masterSIData: Partial<Omit<MasterSI, 'id' | 'createdAt' | 'updatedAt' | 'creatorName' | 'creatorEmail'>>, token: string): Promise<SingleItemResponse<MasterSI>> => {
    try {
        const payload: any = { ...masterSIData };
        if (payload.membres !== undefined && Array.isArray(payload.membres)) {
            payload.membres = JSON.stringify(payload.membres);
        }

        const responseData = await fetchWithAuth(`${API_BASE_URL}/mastersis/${id}`, token, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (responseData.success && responseData.data) {
            return { success: true, data: responseData.data, message: responseData.message };
        } else {
            return { success: false, data: null, message: responseData.message || 'Failed to update Master SI.' };
        }
    } catch (error: any) {
        console.error(`Error updating Master SI with ID ${id}:`, error);
        return { success: false, data: null, message: error.message || 'Unknown error' };
    }
};

/**
 * Deletes a Master SI.
 * @param id The ID of the Master SI to delete.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a DeleteResponse indicating success or failure.
 */
export const deleteMasterSI = async (id: string, token: string): Promise<DeleteResponse> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/mastersis/${id}`, token, { method: 'DELETE' });
    if (responseData.success) {
      return { success: true, message: responseData.message || 'Master SI deleted successfully.' };
    } else {
      return { success: false, message: responseData.message || 'Failed to delete Master SI.' };
    }
  } catch (error: any) {
    console.error(`Error deleting Master SI with ID ${id}:`, error);
    return { success: false, message: error.message || 'Unknown error' };
  }
};
