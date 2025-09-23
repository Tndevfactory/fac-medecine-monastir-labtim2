// services/presentationApi.ts

import { PresentationContent, ContentBlock, ImageContentBlock } from '@/types/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Utility function for making authenticated requests.
 * Handles both JSON and FormData bodies.
 */
const fetchWithAuth = async (url: string, token: string, options?: RequestInit) => {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  };

  if (options?.body instanceof FormData) {
    // Do nothing, let browser set Content-Type for FormData
  } else if (options?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'; // Default to JSON if body exists and no type set
  }

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
  return await response.json();
};

/**
 * Fetches the main presentation content.
 * @returns A promise that resolves to the PresentationContent object.
 */
export const getMainPresentationContent = async (): Promise<{ success: boolean; data: PresentationContent | null; message?: string }> => {
  try {
    const url = `${API_BASE_URL}/presentation/main`;
    const response = await fetch(url); // Public endpoint, no auth token needed for GET
    const data = await response.json();
      if (!response.ok) {
        return { success: false, data: null, message: data.message || 'Failed to fetch presentation content.' };
    }
    return { success: true, data: data.data };
  } catch (error: any) {
    console.error('Error fetching main presentation content:', error);
      return { success: false, data: null, message: error.message || 'Network error.' };
  }
};

/**
 * Updates the main presentation content.
 * This function handles sending an array of content blocks,
 * including new image files with unique keys.
 * @param contentBlocks The array of content blocks to save.
 * @param formData The FormData object containing all data, including files and stringified blocks.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the updated PresentationContent.
 */
// IMPORTANT: Signature changed from (contentBlocks, token) to (formData, token)
export const updateMainPresentationContent = async (formData: FormData, token: string): Promise<PresentationContent> => {
    try {
        // We no longer build formData here; it's passed directly from PresentationManagement.tsx
        // The error "contentBlocks.map is not a function" was occurring because the old signature expected
        // contentBlocks as the first argument, but formData was being passed.
        // Now, we expect formData directly.

        const responseData = await fetchWithAuth(`${API_BASE_URL}/presentation/main`, token, {
            method: 'PUT',
            body: formData, // Send as FormData
        });
        return responseData.data;
    } catch (error: any) {
        console.error('Error updating main presentation content (API service):', error);
        throw new Error(`Failed to update presentation content: ${error.message || 'Unknown error'}`);
    }
};
