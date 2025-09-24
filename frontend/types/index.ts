// frontend/types/index.ts

// Existing types (keep them)
export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  position?: string;
  phone?: string;
  image?: string;
  orcid?: string;
  biography?: string;
  expertises?: string[];
  researchInterests?: string[];
  universityEducation?: { degree: string; institution: string; year: number }[];
  cin?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  postalCode?: string;
  country?: string;
  city?: string;
  occupation?: string;
  nationality?: string;
  isBlocked?: boolean;
  mustChangePassword?: boolean;
  expirationDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string[]; // Array of author names
  journal: string;
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords?: string[];
  type: 'journal' | 'conference' | 'book_chapter' | 'preprint' | 'other';
  citationCount?: number;
  creatorName?: string; // Populated by backend join
  creatorEmail?: string; // Populated by backend join
  userId?: string; // Foreign key
  createdAt?: string;
  updatedAt?: string;
}

export interface Thesis {
  id: string;
  title: string;
  author: string;
  year: number;
  summary: string;
  type: 'HDR' | 'These'; // Habilitation à Diriger des Recherches or Thèse
  etablissement: string;
  specialite: string;
  encadrant: string; // Supervisor
  membres: string[]; // Jury members (array of strings)
  creatorName?: string; // Populated by backend join
  creatorEmail?: string; // Populated by backend join
  userId?: string; // Foreign key
  createdAt?: string;
  updatedAt?: string;
}

// NEW: MasterSI interface
export interface MasterSI {
  id: string;
  title: string;
  author: string;
  year: number;
  summary: string;
  type: 'Master' | 'PFE'; // Master or Projet de Fin d'Études (PFE)
  etablissement: string;
  specialite: string;
  encadrant: string; // Supervisor
  membres: string[]; // Jury members (array of strings)
  creatorName?: string; // Populated by backend join
  creatorEmail?: string; // Populated by backend join
  userId?: string; // Foreign key
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO 8601 string, e.g., "YYYY-MM-DD"
  location: string;
  image?: string; // Optional image URL for the event
  organizer?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarouselItem {
  id: string;
  imageUrl: string; // URL of the image, e.g., "/uploads/carousel_images/image.jpg"
  title?: string; // Corresponds to 'title' in DB
  description?: string;
  order: number; // For sorting carousel items
  link?: string; // Corresponds to 'link' in DB, mapped to 'linkUrl' in frontend UI for clarity
  createdAt?: string;
  updatedAt?: string;
}

// Dynamic Content Block Types for Presentation Page
// Base interface for all content blocks
export interface ContentBlock {
  id: string; // Unique ID for React keys and internal management
  type: 'text' | 'image'; // Add more types like 'counter', 'director_info' later if needed as flexible blocks
}

export interface TextContentBlock extends ContentBlock {
  type: 'text';
  value: string; // HTML string from Quill editor
}

export interface ImageContentBlock extends ContentBlock {
  type: 'image';
  url: string | null; // URL or path to the image
  altText?: string;
  caption?: string;
  file?: File; // Temporary property for file upload on frontend, not saved to DB
  originalWidth?: number;
  originalHeight?: number;
  
  // These will be the *scaled* dimensions for display
  width?: number; // Optional width for image, in pixels (will be calculated from slider)
  height?: number; // Optional height for image, in pixels (will be calculated from slider)
  
  // Slider value for controlling size (0-100)
  sizeSliderValue?: number; // New field for the slider position
}

// Main Presentation Content Type (matches backend model)
export interface PresentationContent {
  id: string;
  sectionName: string; // 'main_presentation'
  contentBlocks: ContentBlock[]; // Array of mixed content blocks

  // NEW DYNAMIC FIELDS (Fixed fields, not part of flexible contentBlocks array)
  directorName: string | null;
  directorPosition: string | null;
  directorImage: string | null; // URL or path to director's image

  counter1Value: number | null;
  counter1Label: string | null;
  counter2Value: number | null;
  counter2Label: string | null;
  counter3Value: number | null;
  counter3Label: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface Hero {
  id?: string;
  title: string;
  description: string;
  buttonContent: string;
  imageUrl: string | null; // URL to the image, or null
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User; // Reusing the User interface from this file
}

// Generic API response for password reset, etc.
export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

// Auth response for login/register endpoints
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}
