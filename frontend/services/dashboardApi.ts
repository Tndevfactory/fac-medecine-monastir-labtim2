// services/dashboardApi.ts
// This file centralizes API calls for dashboard statistics and user management.

import { User } from '@/types/index'; // Import User type

// Generic response type for list endpoints
export type ListItemsResponse<T> = {
  success: boolean;
  data: T[];
  message?: string;
  count?: number;
};

// IMPORTANT: Updated to use a relative path for API calls.
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api'; // Ensure this matches your backend URL for direct API calls

/**
 * Utility function for making authenticated requests that can handle FormData.
 * This is crucial because when sending FormData, the 'Content-Type' header
 * must NOT be manually set to 'multipart/form-data'; the browser handles it,
 * including the boundary string.
 *
 * @returns The parsed JSON response. Always returns an object.
 * @throws An Error if response.ok is false, using the message from the backend JSON if available.
 * If response.ok is true but JSON parsing fails, it returns an object with a warning message.
 */
const fetchWithAuth = async (url: string, token?: string, options?: RequestInit) => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // If the request body is FormData, ensure 'Content-Type' is not explicitly set.
  if (options?.body instanceof FormData) {
    delete headers['Content-Type']; 
  } else if (options?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'; // Default to JSON for non-FormData
  }

  const response = await fetch(url, { ...options, headers });

  let jsonResponse: any = {}; // Initialize as an empty object
  const contentType = response.headers.get('content-type');

  // Only attempt to parse JSON if content-type is JSON and there's content.
  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      console.warn(`[fetchWithAuth] Response from ${url} was JSON but parsing failed, status: ${response.status}.`, parseError);
      // If parsing fails for a JSON type, include a specific message.
      jsonResponse = { message: `Invalid JSON response from server: ${response.statusText || 'Unknown error'}` };
    }
  } else {
    // For non-JSON responses or 204 No Content, we can still get a statusText.
    console.warn(`[fetchWithAuth] Response from ${url} was not JSON or no content (status: ${response.status}, content-type: ${contentType}).`);
    jsonResponse = { message: response.statusText || 'No content or non-JSON response from server.' };
  }

  // If the HTTP response itself is not OK (e.g., 4xx, 5xx), throw an error.
  // The message will come from backend's JSON if present, otherwise from statusText or generic.
  if (!response.ok) {
    const errorMessage = typeof jsonResponse.message === 'string' && jsonResponse.message.length > 0
      ? jsonResponse.message
      : response.statusText || `Request failed with status: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // If response.ok is true, return the parsed JSON (or the constructed object if parsing failed/no content)
  return jsonResponse;
};


/**
 * Fetches all users (members) from the backend.
 * This function now explicitly requires a token and conditionally includes archived users.
 * @param token The JWT token for authentication.
 * @param includeArchived Optional: if true, also include archived users. Defaults to false.
 * @returns A promise that resolves to a ListItemsResponse containing an array of User objects.
 * @throws An error if the API call fails or returns an error.
 */
export const getAllUsers = async (token?: string, includeArchived: boolean = false): Promise<ListItemsResponse<User>> => {
  try {
    // Construct URL: only add includeArchived=true if it's true.
    // If includeArchived is false, the parameter is omitted entirely.
    const url = includeArchived ? `${API_BASE_URL}/users?includeArchived=true` : `${API_BASE_URL}/users`;
    
    console.log(`[DEBUG - getAllUsers API] Fetching URL: ${url} with includeArchived=${includeArchived}`); 
    
    const responseData = await fetchWithAuth(url, token, { method: 'GET' });
    
    if (responseData.success === true && Array.isArray(responseData.data)) {
      return { success: true, data: responseData.data, message: responseData.message, count: responseData.count }; 
    } 
    const errorMessage = responseData?.message || 'Failed to fetch users: Unexpected response.';
    throw new Error(errorMessage);
  } catch (error: any) {
    console.error('Error fetching all users (in getAllUsers):', error);
    throw new Error(`Failed to fetch users: ${error.message || 'Unknown error'}`);
  }
};


/**
 * Creates a new user via the admin API.
 * This now expects FormData for user data and optional file upload.
 * @param userData The FormData object containing user data and profileImage.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the created User object (or null if only message returned).
 * @throws An error if the API call fails or backend reports failure.
 */
export const createUser = async (userData: FormData, token: string): Promise<User | null> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/users`, token, {
      method: 'POST',
      body: userData, 
    });
    
    // MODIFIED: If success is true, we consider it a success.
    // If data is present, return it. Otherwise, return null and let the component use responseData.message.
    if (responseData && responseData.success === true) {
      if (responseData.data) {
        return responseData.data; // Backend returned the created user object
      } else {
        // Backend returned success: true, but no 'data' object.
        // This is a success, but we can't return a 'User' type strictly.
        // The calling component will check for this null return and use responseData.message.
        console.warn(`[createUser] Backend reported success but did not return 'data' object. Message: ${responseData.message || 'No message.'}`);
        return null; 
      }
    }
    // If we reach here, it means responseData.success was false.
    throw new Error(responseData?.message || 'Failed to create user: Backend reported failure.');
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Updates an existing user by ID.
 * This now expects FormData for user data and optional file upload.
 * @param userId The ID of the user to update.
 * @param userData The FormData object containing partial user data and profileImage.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the updated User object (or null if only message returned).
 * @throws An error if the API call fails.
 */
export const updateUser = async (userId: string, userData: FormData, token: string): Promise<User | null> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, token, {
      method: 'PUT',
      body: userData, 
    });
    
    // MODIFIED: Similar logic to createUser for success handling.
    if (responseData && responseData.success === true) {
      if (responseData.user) { // Backend now returns 'user' not 'data' for update
        return responseData.user; 
      } else {
        console.warn(`[updateUser] Backend reported success but did not return 'user' object. Message: ${responseData.message || 'No message.'}`);
        return null; 
      }
    }
    throw new Error(responseData?.message || 'Failed to update user: Backend reported failure.');
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Deletes a user by ID.
 * @param userId The ID of the user to delete.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves when the user is successfully deleted.
 * @throws An error if the API call fails.
 */
export const deleteUser = async (userId: string, token: string): Promise<void> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, token, {
      method: 'DELETE',
    });
    // For delete, we typically just need success: true.
    if (responseData && responseData.success === true) {
      return; // Success, operation completed.
    }
    throw new Error(responseData?.message || 'Failed to delete user: Backend reported failure or unexpected response.');
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error.message || 'Unknown error'}`);
  }
};


/**
 * Fetches the total count of all members (users) from a dedicated stat endpoint.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the total number of users.
 * @throws An error if the API call fails or returns an error.
 */
export const getMemberCount = async (token: string): Promise<number> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/stats/members`, token, { method: 'GET' });
    
    if (responseData && responseData.success === true && typeof responseData.count === 'number') {
      return responseData.count;
    }
    throw new Error(responseData?.message || 'Unexpected API response for member count: Expected an object with success: true and a "count" number.');
  } catch (error: any) {
    console.error('Error fetching member count:', error);
    throw new Error(`Failed to fetch member count: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Fetches the count of publications from the backend.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the number of publications.
 * @throws An error if the API call fails or returns an error.
 */
export const getPublicationCount = async (token: string): Promise<number> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/publications`, token, { method: 'GET' });
    
    if (responseData && responseData.success === true && typeof responseData.count === 'number') {
      return responseData.count;
    }
    throw new Error(responseData?.message || 'Unexpected API response for publication count: Expected an object with success: true and a "count" number.');
  } catch (error: any) {
    console.error('Error fetching publication count:', error);
    throw new Error(`Failed to fetch publication count: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Fetches the count of theses from the backend.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the number of theses.
 * @throws An error if the API call fails or returns an error.
 */
export const getThesisCount = async (token: string): Promise<number> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/theses`, token, { method: 'GET' });
    
    if (responseData && responseData.success === true && typeof responseData.count === 'number') {
      return responseData.count;
    }
    throw new Error(responseData?.message || 'Unexpected API response for thesis count: Expected an object with success: true and a "count" number.');
  } catch (error: any) {
    console.error('Error fetching thesis count:', error);
    throw new Error(`Failed to fetch thesis count: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Fetches the count of Master/PFE projects from the backend.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the number of Master/PFE projects.
 * @throws An error if the API call fails or returns an error.
 */
export const getMasterPFECoount = async (token: string): Promise<number> => {
  try {
    const responseData = await fetchWithAuth(`${API_BASE_URL}/mastersis`, token, { method: 'GET' });
    
    if (responseData && responseData.success === true && typeof responseData.count === 'number') {
      return responseData.count;
    }
    throw new Error(responseData?.message || 'Unexpected API response for Master/PFE count: Expected an object with success: true and a "count" number.');
  } catch (error: any) {
    console.error('Error fetching Master/PFE count:', error);
    throw new Error(`Failed to fetch Master/PFE count: ${error.message || 'Unknown error'}`);
  }
};

export const sendUserCredentials = async (userId: string, token: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/send-credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // No body needed, but keep for consistency if fetchWithAuth uses it
      },
      // No body needed for this POST request as data is derived on backend
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse error response as JSON for sendUserCredentials:', parseError);
        errorData.message = response.statusText || `Request failed with status ${response.status}`;
      }
      throw new Error(errorData.message || 'An unknown error occurred while sending credentials.');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error sending user credentials:', error);
    throw new Error(`Failed to send user credentials: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Fetches a single user by ID.
 * This function is now designed for PUBLIC access (no token required).
 * @param userId The ID of the user to fetch.
 * @returns A promise that resolves to an object containing success status, user data, and message.
 */
export const getUserById = async (userId: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  try {
    // No token passed to fetch for this public endpoint
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
    });
    const responseData = await response.json();

    if (response.ok && responseData.success && responseData.user) { // Backend returns 'user' not 'data'
      return { success: true, user: responseData.user as User, message: responseData.message }; 
    } 
    const errorMessage = responseData?.message || response.statusText || 'Failed to fetch user data: Unexpected response.';
    return { success: false, message: errorMessage };
  } catch (error: any) {
    console.error('Error fetching user by ID:', error);
    return { success: false, message: `Network error or unexpected response: ${error.message}` };
  }
};


/**
 * Updates a user's profile.
 * @param userId The ID of the user to update.
 * @param userData FormData containing the updated user data (can include file for image).
 * @param token The authentication token.
 * @returns A promise that resolves to an object containing success status, updated user data, and message.
 */
export const updateUserProfile = async (userId: string, userData: FormData, token: string): Promise<{ success: boolean; user?: User; message?: string; token?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DO NOT set 'Content-Type': 'multipart/form-data' here. The browser sets it automatically with the boundary.
      },
      body: userData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to update user profile.' };
    }

    return { success: true, user: data.user, token: data.token, message: data.message }; // Assuming backend returns updated user and potentially new token
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: `Network error or unexpected response: ${error.message}` };
  }
};
