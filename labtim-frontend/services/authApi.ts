// services/authApi.ts
import { User, AuthResponse, ApiResponse, LoginResponse } from '@/types/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Registers a new user.
 * @param userData User data including email, password, etc.
 * @returns A promise that resolves to the AuthResponse.
 */
export const registerUser = async (userData: any): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register user');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(`Registration error: ${error.message}`);
  }
};

/**
 * Logs in a user.
 * @param credentials User email and password.
 * @returns A promise that resolves to the AuthResponse.
 */
export const loginUser = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Throw the error data message so the calling component can display it
      throw new Error(errorData.message || 'Login failed. Please check your credentials.');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error logging in user:', error);
    throw new Error(`Login error: ${error.message}`);
  }
};

/**
 * Checks if any users exist in the database.
 * @returns A promise that resolves to an object with an 'exists' boolean.
 */
export const checkUsersExist = async (): Promise<{ exists: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-users-exist`);
    if (!response.ok) {
      // This case should ideally not happen for a simple GET request
      throw new Error('Failed to check user existence.');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error checking for existing users:', error);
    throw new Error(`User existence check error: ${error.message}`);
  }
};

/**
 * Registers the first admin user. Only callable if no users exist.
 * @param userData User data for the initial admin (name, email, password).
 * @returns A promise that resolves to the AuthResponse.
 */
export const initialAdminSignup = async (userData: { name: string; email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/initial-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register initial admin');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error registering initial admin:', error);
    throw new Error(`Initial admin signup error: ${error.message}`);
  }
};

/**
 * Changes a user's password (general case, requires old password).
 * This function now returns the full response JSON,
 * even if response.ok is false, so the caller can check `response.success` and `response.message`.
 */
export const changePassword = async (oldPassword: string, newPassword: string, token: string): Promise<{ success: boolean; message?: string; token?: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    // If response is not OK, parse the error data and return it directly
    // DO NOT THROW AN ERROR HERE, so the calling component can handle the message.
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Failed to change password: Unknown error' };
    }
    
    // If response is OK, return the successful JSON response
    return await response.json();
  } catch (error: any) {
    console.error('Error changing password via API (network/parsing error):', error);
    // This catch block will only be hit for network errors or JSON parsing errors,
    // not for HTTP 4xx/5xx responses where the backend sends JSON error messages.
    return { success: false, message: `Failed to change password due to network or parsing error: ${error.message}` };
  }
};

/**
 * Handles initial password setup for a user who must change their password (first login).
 * Does NOT require the old password.
 * Can either change to a new password or confirm to keep the current one.
 */
export const initialPasswordSetup = async (
  newPassword: string | null, // Null if action is 'keep'
  action: 'change' | 'keep',
  token: string
): Promise<{ success: boolean; message?: string; token?: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/initial-password-setup`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword, action }), // Send newPassword only if action is 'change'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Failed to setup initial password: Unknown error' };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error during initial password setup via API (network/parsing error):', error);
    return { success: false, message: `Failed to setup initial password due to network or parsing error: ${error.message}` };
  }
};

// NEW: Request Password Reset Link
export const requestPasswordReset = async (email: string): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    // Even if response.ok is false, we might still want to show a generic message
    // to prevent email enumeration. Backend should handle this.
    throw new Error(data.message || 'Failed to request password reset link.');
  }
  return data;
};

// NEW: Reset Password with Token
export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reset password.');
  }
  return data; // This should log the user in automatically
};
