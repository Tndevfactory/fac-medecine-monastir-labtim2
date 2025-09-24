// services/carouselApi.ts

import { CarouselItem } from '@/types/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Utility function for making authenticated requests.
 * Always sends JSON for publication data (since no files are involved based on the new type).
 * Returns the raw JSON response from the backend (which includes success/data properties).
 */
const fetchWithAuth = async (url: string, token: string, options?: RequestInit) => {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json', // Always send JSON
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse error response as JSON:', parseError);
      errorData.message = response.statusText || `Request failed with status ${response.status}`;
    }
    throw new Error(errorData.message || 'An unknown error occurred.');
  }
  // Return the full JSON response, e.g., { success: true, data: {...} }
  return await response.json();
};

/**
 * Fetches all carousel items.
 * @returns A promise that resolves to an object containing success, count, and data.
 */
export const getAllCarouselItems = async (token: string): Promise<{ success: boolean; count: number; data: CarouselItem[]; message?: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/carousel`, token);
    return response;
  } catch (error: any) {
    console.error('Error fetching all carousel items:', error);
    return { success: false, count: 0, data: [], message: error.message || 'Failed to fetch carousel items.' };
  }
};

/**
 * Fetches a single carousel item by ID.
 * @param id The ID of the carousel item.
 * @returns A promise that resolves to an object containing success and data.
 */
export const getCarouselItemById = async (id: string, token: string): Promise<{ success: boolean; data: CarouselItem; message?: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/carousel/${id}`, token);
    return response;
  } catch (error: any) {
    console.error(`Error fetching carousel item with ID ${id}:`, error);
    return { success: false, data: {} as CarouselItem, message: error.message || `Failed to fetch carousel item with ID ${id}.` };
  }
};

/**
 * Creates a new carousel item.
 * @param formData FormData containing image and text data.
 * @param token Authentication token.
 * @returns A promise that resolves to an object containing success, message, and data.
 */
export const createCarouselItem = async (formData: FormData, token: string): Promise<{ success: boolean; message?: string; data?: CarouselItem }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/carousel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Do NOT set 'Content-Type': 'multipart/form-data' here.
        // The browser will set it automatically with the correct boundary when sending FormData.
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create carousel item');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error creating carousel item:', error);
    return { success: false, message: error.message || 'Failed to create carousel item.' };
  }
};

/**
 * Updates an existing carousel item.
 * @param id The ID of the carousel item to update.
 * @param formData FormData containing updated image and text data.
 * @param token Authentication token.
 * @returns A promise that resolves to an object containing success, message, and data.
 */
export const updateCarouselItem = async (id: string, formData: FormData, token: string): Promise<{ success: boolean; message?: string; data?: CarouselItem }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/carousel/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // *** CRITICAL FIX: DO NOT SET 'Content-Type' HERE FOR FormData ***
        // The browser automatically sets 'Content-Type: multipart/form-data'
        // with the correct boundary when you send a FormData object as the body.
        // Manually setting it here will break the request body parsing on the backend.
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update carousel item');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error updating carousel item:', error);
    throw new Error(`Failed to update carousel item: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Deletes a carousel item by ID.
 * @param id The ID of the carousel item to delete.
 * @param token Authentication token.
 * @returns A promise that resolves to an object indicating success.
 */
export const deleteCarouselItem = async (id: string, token: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/carousel/${id}`, token, {
      method: 'DELETE',
    });
    return response;
  } catch (error: any) {
    console.error('Error deleting carousel item:', error);
    return { success: false, message: error.message || 'Failed to delete carousel item.' };
  }
};

/**
 * Updates the order of multiple carousel items.
 * @param orderedItems An array of objects, each with 'id' and 'order' properties.
 * @param token Authentication token.
 * @returns A promise that resolves when the order is successfully updated.
 */
export const updateCarouselItemOrder = async (orderedItems: { id: string; order: number }[], token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/carousel/reorder`, { // Use fetch directly for JSON body
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // Explicitly set Content-Type for JSON body
      },
      body: JSON.stringify({ items: orderedItems }), // Send an array of {id, order} objects as JSON
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse error response as JSON for reorder:', parseError);
        errorData.message = response.statusText || `Request failed with status ${response.status}`;
      }
      throw new Error(errorData.message || 'An unknown error occurred during carousel order update.');
    }
    // Assuming the backend returns success: true on successful reorder, no need to parse if just status 200/204
    // If backend sends JSON, you might want to parse it:
    // const responseData = await response.json();
    // if (!responseData.success) {
    //   throw new Error(responseData.message || 'Failed to update carousel item order: Backend reported failure.');
    // }
    return; // No specific data returned, just success status
  } catch (error: any) {
    console.error('Error updating carousel item order:', error);
    throw new Error(`Failed to update carousel order: ${error.message || 'Unknown error'}`);
  }
};
