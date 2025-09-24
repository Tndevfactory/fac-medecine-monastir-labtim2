// frontend/services/heroApi.ts

import { Hero } from '@/types/index'; // Assuming you'll add Hero type to types/index.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Fetches the single Hero section data.
 * @returns A promise that resolves to the Hero data.
 */
export const getHeroSection = async (): Promise<{ success: boolean; data: Hero; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hero`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch hero section data.');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching hero section:', error);
    return { success: false, data: {} as Hero, message: error.message || 'Failed to fetch hero section.' };
  }
};

/**
 * Saves (creates or updates) the single Hero section data.
 * @param formData FormData containing hero fields and optional image.
 * @param token Authentication token.
 * @returns A promise that resolves to the updated Hero data.
 */
export const saveHeroSection = async (formData: FormData, token: string): Promise<{ success: boolean; data: Hero; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hero`, {
      method: 'PUT', // Use PUT for update/create (upsert-like behavior)
      headers: {
        'Authorization': `Bearer ${token}`,
        // DO NOT set 'Content-Type' here for FormData. The browser handles it.
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save hero section.');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error saving hero section:', error);
    throw new Error(`Failed to save hero section: ${error.message || 'Unknown error'}`);
  }
};
