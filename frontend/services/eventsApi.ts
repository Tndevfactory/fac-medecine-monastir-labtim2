// frontend/services/eventsApi.ts
import { Event } from '@/types/index';

export type ListItemsResponse<T> = {
  success: boolean;
  data: T[];
  message?: string;
  count?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

const fetchWithAuth = async (url: string, token?: string, options?: RequestInit) => {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
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
      jsonResponse = { message: `Invalid JSON response from server: ${response.statusText || 'Unknown error'}` };
    }
  } else {
    jsonResponse = { message: response.statusText || 'No content or non-JSON response from server.' };
  }
  if (!response.ok) {
    const errorMessage = typeof jsonResponse.message === 'string' && jsonResponse.message.length > 0
      ? jsonResponse.message
      : response.statusText || `Request failed with status: ${response.status}`;
    throw new Error(errorMessage);
  }
  return jsonResponse;
};

export const getAllEvents = async (token?: string): Promise<ListItemsResponse<Event>> => {
  return await fetchWithAuth(`${API_BASE_URL}/events`, token, { method: 'GET' });
};

export const createEvent = async (eventData: FormData, token: string) => {
  return await fetchWithAuth(`${API_BASE_URL}/events`, token, { method: 'POST', body: eventData });
};

export const updateEvent = async (id: string, eventData: FormData, token: string) => {
  return await fetchWithAuth(`${API_BASE_URL}/events/${id}`, token, { method: 'PUT', body: eventData });
};

export const deleteEvent = async (id: string, token: string) => {
  return await fetchWithAuth(`${API_BASE_URL}/events/${id}`, token, { method: 'DELETE' });
};
