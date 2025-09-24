// services/publicationsApi.ts

import { Publication } from '@/types/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

// Define a common interface for API responses that include data for a single item
interface SingleItemResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

// Define a common interface for API responses that include a list of items
interface ListItemsResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
  count?: number; // Added count for consistency with backend
}

// Define a common interface for API responses for deletion (no data returned)
interface DeleteResponse {
  success: boolean;
  message?: string;
}


/**
 * Utility function for making authenticated requests.
 * Always sends JSON for publication data (since no files are involved based on the new type).
 * Returns the raw JSON response from the backend (which includes success/data properties).
 * MODIFIED: Token is now optional.
 */
const fetchWithAuth = async (url: string, token: string | null = null, options?: RequestInit) => { // token is now optional
  const headers: HeadersInit = {
    'Content-Type': 'application/json', // Always send JSON
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
      throw new Error(`Invalid JSON response from server: ${response.statusText || 'Unknown error'}`);
    }
  } else if (!response.ok) {
      // If not JSON and not OK, throw error with status text
      throw new Error(response.statusText || `Request failed with status ${response.status}`);
  }
  // If response.ok is true and it's not JSON, or 204, return a default success.
  // This might happen for DELETE operations that return 204 No Content.
  if (response.ok && Object.keys(jsonResponse).length === 0 && response.status === 204) {
      return { success: true, message: "Operation successful, no content returned." };
  }


  if (!response.ok) {
    const errorMessage = jsonResponse.message || response.statusText || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // Return the full JSON response, e.g., { success: true, data: {...} }
  return jsonResponse;
};

/**
 * Fetches all publications.
 * @param token The JWT token for authentication (optional for public access).
 * @param creatorId Optional: If provided, fetches publications by this creator ID.
 * @param year Optional: Filter publications by year.
 * @param searchTerm Optional: Filter publications by title or authors.
 * @returns A promise that resolves to a ListItemsResponse containing an array of publications.
 */
export const getAllPublications = async (
  token: string | null = null, // token is now optional
  creatorId?: string, 
  year?: number | null, 
  searchTerm?: string 
): Promise<ListItemsResponse<Publication>> => {
  try {
    const queryParams = new URLSearchParams();
    if (creatorId) {
      queryParams.append('creatorId', creatorId);
    }
    if (year) {
      queryParams.append('year', year.toString());
    }
    if (searchTerm) {
      queryParams.append('searchTerm', searchTerm);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/publications${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[DEBUG - getAllPublications API] Fetching URL: ${url}`); 

    // Pass token (which might be null) to fetchWithAuth
    const responseData = await fetchWithAuth(url, token, { method: 'GET' });
    
    if (responseData.success && Array.isArray(responseData.data)) {
      return { success: true, data: responseData.data, message: responseData.message, count: responseData.count };
    } else {
      return { success: false, data: [], message: responseData.message || 'Failed to fetch publications or invalid data format.' };
    }
  } catch (error: any) {
    console.error('Error fetching publications:', error);
    return { success: false, data: [], message: error.message || 'Network error.' };
  }
};

/**
 * Fetches a single publication by ID.
 * @param id The ID of the publication to fetch.
 * @param token The JWT token for authentication (optional, as this route is public).
 * @returns A promise that resolves to a SingleItemResponse containing the publication data or null if not found.
 */
export const getPublicationById = async (id: string, token: string | null = null): Promise<SingleItemResponse<Publication>> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/publications/${id}`, token, { method: 'GET' });

    if (responseData.success && responseData.data) {
        return { success: true, data: responseData.data, message: responseData.message };
    } else {
        return { success: false, data: null, message: responseData.message || 'Publication not found.' };
    }
  } catch (error: any) {
    console.error(`Error fetching publication with ID ${id}:`, error);
    return { success: false, data: null, message: error.message || 'Network error.' };
  }
};

/**
 * Creates a new publication.
 * @param publicationData The data for the new publication.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a SingleItemResponse containing the created publication.
 */
export const createPublication = async (publicationData: Omit<Publication, 'id' | 'createdAt' | 'updatedAt' | 'creatorName' | 'creatorEmail'>, token: string): Promise<SingleItemResponse<Publication>> => {
    try {
        const payload: any = { ...publicationData };
        if (payload.authors !== undefined && Array.isArray(payload.authors)) {
            payload.authors = JSON.stringify(payload.authors);
        }
        const responseData = await fetchWithAuth(`${API_BASE_URL}/publications`, token, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (responseData.success && responseData.data) {
            return { success: true, data: responseData.data, message: responseData.message };
        } else {
            return { success: false, data: null, message: responseData.message || 'Failed to create publication.' };
        }
    } catch (error: any) {
        console.error('Error creating publication:', error);
        return { success: false, data: null, message: error.message || 'Unknown error' };
    }
};

/**
 * Updates an existing publication.
 * @param id The ID of the publication to update.
 * @param publicationData The updated data for the publication.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a SingleItemResponse containing the updated publication.
 */
export const updatePublication = async (id: string, publicationData: Partial<Omit<Publication, 'id' | 'createdAt' | 'updatedAt' | 'creatorName' | 'creatorEmail'>>, token: string): Promise<SingleItemResponse<Publication>> => {
    try {
        const payload: any = { ...publicationData };
        if (payload.authors !== undefined && Array.isArray(payload.authors)) {
            payload.authors = JSON.stringify(payload.authors);
        }
        const responseData = await fetchWithAuth(`${API_BASE_URL}/publications/${id}`, token, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (responseData.success && responseData.data) {
            return { success: true, data: responseData.data, message: responseData.message };
        } else {
            return { success: false, data: null, message: responseData.message || 'Failed to update publication.' };
        }
    } catch (error: any) {
        console.error(`Error updating publication with ID ${id}:`, error);
        return { success: false, data: null, message: error.message || 'Unknown error' };
    }
};

/**
 * Deletes a publication.
 * @param id The ID of the publication to delete.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to a DeleteResponse indicating success or failure.
 */
export const deletePublication = async (id: string, token: string): Promise<DeleteResponse> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/publications/${id}`, token, { method: 'DELETE' });
    if (responseData.success) {
      return { success: true, message: responseData.message || 'Publication deleted successfully.' };
    } else {
      return { success: false, message: responseData.message || 'Failed to delete publication.' };
    }
  } catch (error: any) {
    console.error(`Error deleting publication with ID ${id}:`, error);
    return { success: false, message: error.message || 'Unknown error' };
  }
};
