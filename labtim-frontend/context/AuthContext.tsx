// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, UserRole } from '@/types/index'; // Import User interface from types

// Define the shape of the decoded JWT payload
interface DecodedToken {
  id: string;
  email: string; // Ensure email is in token for consistency
  role: UserRole;
  exp: number; // Expiration time (in seconds)
  name?: string; // name from JWT payload
  mustChangePassword?: boolean; // NEW: Add mustChangePassword to token payload
  // Add other fields from the JWT payload if you put them there for quick access
  // e.g., position?: string; image?: string;
}

// Define the shape of the AuthContext value
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userId: string | null;
  userName: string | null;
  user: User | null; // IMPORTANT: Add full user object to context
  mustChangePassword: boolean; // NEW: Expose mustChangePassword state
  login: (token: string, userData: User) => void; // MODIFIED: Accept userData
  logout: () => void;
  token: string | null;
  isLoading: boolean;
  getSessionTimeRemaining: () => number | null; // New function
}

// Create the context with a default (undefined) value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // State for full user object
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false); // NEW: State for mustChangePassword

  // Effect to check local storage for token on initial load
  useEffect(() => {
    const checkAuthStatus = () => {
      const storedToken = localStorage.getItem('jwtToken');
      if (storedToken) {
        try {
          const decoded: DecodedToken = jwtDecode(storedToken);
          // Check if token is expired
          if (decoded.exp * 1000 > Date.now()) {
            setToken(storedToken);
            setIsAuthenticated(true);
            setUserRole(decoded.role);
            setUserId(decoded.id);
            setUserName(decoded.name || null);
            setMustChangePassword(decoded.mustChangePassword || false); // NEW: Set from token
            
            // Reconstruct a basic user object from the token payload
            // For a full user object, you'd need to fetch from /api/auth/me after login
            // For now, populate with what's in the token + userId, userName, role, mustChangePassword
            setUser({
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
              name: decoded.name || null,
              mustChangePassword: decoded.mustChangePassword || false, // NEW: Include in user object
              // Add other fields from JWT if they are consistent and reliable
            } as User); // Type assertion, assuming basic User structure from token
          } else {
            console.log('JWT token expired. Clearing from localStorage.');
            localStorage.removeItem('jwtToken');
            setIsAuthenticated(false);
            setUserRole(null);
            setUserId(null);
            setUserName(null);
            setUser(null);
            setToken(null);
            setMustChangePassword(false); // NEW: Reset on logout
          }
        } catch (error) {
          console.error('Failed to decode or verify token from localStorage:', error);
          localStorage.removeItem('jwtToken');
          setIsAuthenticated(false);
          setUserRole(null);
          setUserId(null);
          setUserName(null);
          setUser(null);
          setToken(null);
          setMustChangePassword(false); // NEW: Reset on error
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // MODIFIED: login function now accepts `userData`
  const login = (jwtToken: string, userData: User) => {
    localStorage.setItem('jwtToken', jwtToken);
    const decoded: DecodedToken = jwtDecode(jwtToken);

    setToken(jwtToken);
    setIsAuthenticated(true);
    setUserRole(decoded.role);
    setUserId(decoded.id);
    setUserName(decoded.name || null);
  setMustChangePassword(!!userData.mustChangePassword); // NEW: Set from provided userData, ensure boolean

    // Set the full user object from the provided userData
    setUser(userData);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setUserName(null);
    setUser(null); // Clear full user object on logout
    setIsLoading(false);
    setMustChangePassword(false); // NEW: Reset on logout
  };

  const getSessionTimeRemaining = (): number | null => {
    if (!token) return null;
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      if (!decoded.exp) return null;
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      return Math.max(0, expirationTime - currentTime); // Remaining time in ms
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const value = {
    isAuthenticated,
    userRole,
    userId,
    userName,
    user, // Expose full user object
    mustChangePassword, // NEW: Expose mustChangePassword state
    login,
    logout,
    token,
    isLoading,
    getSessionTimeRemaining,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};