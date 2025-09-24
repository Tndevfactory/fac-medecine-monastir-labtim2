// components/dashboard/UserManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
// Added Calendar as CalendarIcon for clarity
import {
  User, Mail, Lock, PlusCircle, RefreshCw, Trash2, Edit3, Loader2, Info, ArrowLeft,
  Briefcase, Phone, ImageIcon, LinkIcon, AlignLeft, Lightbulb, GraduationCap, XCircle,
  UploadCloud, Eye, EyeOff, ChevronDown, ChevronUp, Search, Calendar as CalendarIcon,
  Download, Archive, Send // NEW: Added Send icon for email
} from 'lucide-react'; // Added Archive icon
import { Inter } from 'next/font/google';

// Import the new UI components
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';

// We need the original API response data (including 'message') for display,
// so we'll need to modify how these functions are imported or called slightly.
// For simplicity, let's make API calls here more explicit to get the full response.
// OR, we can modify dashboardApi.ts functions to return the full responseData object on success.
// Let's adjust dashboardApi.ts to return the full responseData object for consistency,
// and then UserManagement.tsx will read it.
// UPDATED: Import sendUserCredentials
import { getAllUsers, createUser as apiCreateUser, deleteUser, updateUser as apiUpdateUser, sendUserCredentials } from '@/services/dashboardApi'; // Renamed to avoid conflict

import { User as UserType } from '@/types/index';

// Import for react-image-crop
import ReactCrop, { Crop, PixelCrop, PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


const inter = Inter({ subsets: ['latin'] });

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000'; // Your backend server URL

// Helper to generate a random password
const generateRandomPassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};


// Helper to get a cropped image from a canvas
const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<Blob | null> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error("No 2d context for canvas");
    return Promise.resolve(null);
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  // As a Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95); // Adjust quality as needed
  });
};


// Helper function to escape values for CSV
const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let stringValue = String(value);

  // Handle arrays by joining them (e.g., for expertises, researchInterests, universityEducation)
  if (Array.isArray(value)) {
    stringValue = value.map(item => String(item).replace(/"/g, '""')).join('; '); // Use semicolon to differentiate from common CSV commas, escape inner quotes
  } else {
    // Escape existing double quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
  }

  // If the value contains a comma, double quote, or newline, enclose it in double quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes(';')) { // Check for semicolon too if used as internal separator
    return `"${stringValue}"`;
  }
  return stringValue;
};


// Define exportable fields for users
const exportableUserFields = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Nom' },
  { key: 'role', label: 'Rôle' },
  { key: 'position', label: 'Position' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'image', label: 'Image URL' }, // This will export the internal URL
  { key: 'orcid', label: 'ORCID' },
  { key: 'biography', label: 'Biographie' },
  { key: 'expertises', label: 'Expertises' },
  { key: 'researchInterests', label: 'Intérêts de Recherche' },
  { key: 'universityEducation', label: 'Formation Universitaire' },
  { key: 'expirationDate', label: 'Date d\'expiration' },
  { key: 'createdAt', label: 'Date de Création' },
  { key: 'updatedAt', label: 'Date de Dernière Mise à Jour' },
  { key: 'id', label: 'ID' }, // Often useful for debugging/linking
];


const UserManagement: React.FC = () => {
  const { isAuthenticated, userRole, token, isLoading: isAuthLoading, userId: loggedInUserId } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<'list' | 'edit'>('list');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // States for NEW user creation form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'member'>('member');
  const [creatingUser, setCreatingUser] = useState(false);
  const [newExpirationDate, setNewExpirationDate] = useState<string>('');


  // States for DELETE user actions
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // States for EDIT user form (these are also temporarily used for new user optional fields)
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'member'>('member');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserPosition, setEditUserPosition] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserOrcid, setEditUserOrcid] = useState('');
  const [editUserBiography, setEditUserBiography] = useState('');
  const [editUserExpertises, setEditUserExpertises] = useState<string[]>([]);
  const [editUserResearchInterests, setEditUserResearchInterests] = useState<string[]>([]);
const [editUniversityEducation, setEditUniversityEducation] = useState<any[]>([]);
  const [editExpirationDate, setEditExpirationDate] = useState<string>('');


  // Image cropping states
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<Blob | null>(null);

  const [initialSelectedFile, setInitialSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // For managing additions to array fields (Expertises, Research Interests, Education)
  const [newExpertiseItem, setNewExpertiseItem] = useState('');
  const [newResearchInterestItem, setNewResearchInterestItem] = useState('');
  const [newUniversityEducationItem, setNewUniversityEducationItem] = useState<{ degree: string; institution: string; year: string }>({ degree: '', institution: '', year: '' });

  // States for UPDATE user actions
  const [updatingUser, setUpdatingUser] = useState(false);

  // State for password visibility (only for edit user password field)
  const [showPassword, setShowPassword] = useState(false);

  // State for optional profile fields visibility (collapsible section for BOTH create and edit)
  const [showOptionalProfileFields, setShowOptionalProfileFields] = useState(false);

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const usersPerPageOptions = [5, 10, 20];

  const [showExpiredUsers, setShowExpiredUsers] = useState(false);

  // --- New states for Export CSV functionality ---
  const [showExportModal, setShowExportModal] = useState(false);
  // Default to all fields for export
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(
    exportableUserFields.map(field => field.key)
  );
  const [exportingCsv, setExportingCsv] = useState(false);

  // --- New states for Archive functionality ---
  const [confirmArchiveUserId, setConfirmArchiveUserId] = useState<string | null>(null);
  const [archivingUser, setArchivingUser] = useState(false);

  // State for Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  // State for Error Modal
  const [errorModal, setErrorModal] = useState<{ brief: string; detailed?: string; visible: boolean } | null>(null);

  // NEW: State for sending credentials email - tracks which user is currently having credentials sent
  const [sendingCredentialsUserId, setSendingCredentialsUserId] = useState<string | null>(null);


  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Function to toggle optional profile fields visibility
  const toggleOptionalProfileFields = () => {
    setShowOptionalProfileFields(prev => !prev);
  };

// Fetch users - now accepts a flag to show success toast
  const fetchUsers = useCallback(async (showSuccessToast = true) => {
    setLoadingUsers(true);
    setUserError(null); // Clear previous user list error

    // ONLY clear toast here if we are about to show a new success toast from this fetch.
    // Otherwise, assume the calling function (e.g., handleCreateUser) has set its own toast.
    if (showSuccessToast) {
      setToast(null); // Clear previous toasts only if we are about to show a new success toast
    }

    try {
      console.log('[fetchUsers] Initiating fetch...');
      console.log(`[fetchUsers] Current token: ${token ? 'Available' : 'Unavailable'}`);
      console.log(`[fetchUsers] showExpiredUsers: ${showExpiredUsers}`); // This correctly logs the state

      // Pass showExpiredUsers directly to getAllUsers
      const fetchedUsersArray = await getAllUsers(token!, showExpiredUsers); // <--- THIS LINE

      console.log('[fetchUsers] Data received from getAllUsers:', fetchedUsersArray);

      // Now, we don't need to filter on the frontend because the API already filtered
      setUsers(fetchedUsersArray.data);
      console.log(`[fetchUsers] Successfully set ${fetchedUsersArray.data.length} users.`);

      if (showSuccessToast) { // Only show success toast if explicitly requested
        setToast({ message: 'Utilisateurs chargés avec succès.', type: 'success' });
      }

    } catch (err: any) {
      // Use ErrorModal for critical errors during initial fetch
      setErrorModal({
        brief: 'Échec du chargement des utilisateurs.',
        detailed: err.message || 'Une erreur inconnue est survenue lors de la récupération des données des utilisateurs.',
        visible: true
      });
      setUserError(err.message || 'Échec de la récupération des utilisateurs.'); // Keep for conditional rendering
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, showExpiredUsers]); // <--- AND THIS LINE (dependency array)

  // Authentication check and initial fetch - now calls fetchUsers with true for toast
  useEffect(() => {
    console.log('[useEffect] Auth Loading:', isAuthLoading);
    console.log('[useEffect] Is Authenticated:', isAuthenticated);
    console.log('[useEffect] User Role:', userRole);
    console.log('[useEffect] Token:', token ? 'Present' : 'Absent');

    if (!isAuthLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        console.log('[useEffect] Unauthorized access. Redirecting to /connexion.');
        router.push('/connexion');
        return;
      }
      if (isAuthenticated && userRole === 'admin' && token) {
        console.log('[useEffect] Authenticated as admin with token. Calling fetchUsers(true)...');
        fetchUsers(true); // Show toast on initial load
      } else {
        console.log('[useEffect] Conditions for fetching users not met.');
      }
    }
  }, [isAuthenticated, userRole, token, isAuthLoading, router, fetchUsers]);

 // Filtered users for search functionality
  // Now, this memo only handles search, as API handles expired users
  const filteredUsers = useMemo(() => {
    console.log(`[filteredUsers Memo] Original users count: ${users.length}`);
    if (!searchTerm) {
      console.log('[filteredUsers Memo] No search term. Returning all users.');
      return users;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const result = users.filter(user =>
      user.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.position?.toLowerCase().includes(lowerCaseSearchTerm)
    );
    console.log(`[filteredUsers Memo] Filtered users count: ${result.length} for term "${searchTerm}".`);
    return result;
  }, [users, searchTerm]); // Keep users and searchTerm as dependencies

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  console.log(`[Render] Current Users to display (after pagination): ${currentUsers.length}`);
  console.log(`[Render] Total filtered users: ${filteredUsers.length}`);
  console.log(`[Render] Raw 'users' state count: ${users.length}`);


  const handleGeneratePassword = () => {
    const generated = generateRandomPassword();
    if (currentView === 'list') {
      setNewUserPassword(generated);
    } else {
      setEditUserPassword(generated);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInitialSelectedFile(file);
      setCroppedImageFile(null);
      setCompletedCrop(null);
      setImagePreviewUrl(null);

      setCrop(undefined);

      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);

    } else {
      setInitialSelectedFile(null);
      setImagePreviewUrl(null);
      setSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
      setCroppedImageFile(null);

      if (currentView === 'edit' && editingUser?.image) {
        setImagePreviewUrl(editingUser.image.startsWith('/uploads') ? BACKEND_BASE_URL + editingUser.image : editingUser.image || null);
      } else {
        setImagePreviewUrl(null);
      }
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { naturalWidth, naturalHeight } = e.currentTarget;

    const size = Math.min(naturalWidth, naturalHeight);
    const x = (naturalWidth - size) / 2;
    const y = (naturalHeight - size) / 2;

    setCrop({
      x: x,
      y: y,
      unit: '%', // Important: use percentages for fluid sizing
      width: 50, // Set initial width and height, these will be adjusted by the user
      height: 50,
    });
  }, []);

  const onCropChange = useCallback((newCrop: Crop) => {
    setCrop(newCrop);
  }, []);


  const handleCropComplete = useCallback(async (pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCompletedCrop(pixelCrop);
  }, []);


  const handleApplyCrop = async () => {
    if (imgRef.current && completedCrop && initialSelectedFile) {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, initialSelectedFile.name);
      if (croppedBlob) {
        setCroppedImageFile(croppedBlob);
        setImagePreviewUrl(URL.createObjectURL(croppedBlob));
        setSrc(null);
        setCrop(undefined);
        setCompletedCrop(null);
      } else {
        setToast({ message: 'Échec de la création de l\'image recadrée.', type: 'error' });
      }
    } else {
      setToast({ message: 'Impossible d\'appliquer le recadrage: image, recadrage terminé ou fichier initial manquant.', type: 'warning' });
    }
  };

  const handleClearImage = () => {
    setInitialSelectedFile(null);
    setImagePreviewUrl(null);
    setSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setCroppedImageFile(null);
    const fileInput = document.getElementById(currentView === 'list' ? 'profileImage' : 'editProfileImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals

    if (!newUserEmail || !newUserPassword) {
      setErrorModal({ brief: 'Email et mot de passe sont requis.', detailed: 'Veuillez remplir tous les champs obligatoires.', visible: true });
      setCreatingUser(false);
      return;
    }

    const formData = new FormData();
    formData.append('email', newUserEmail);
    formData.append('password', newUserPassword);
    if (newUserName) formData.append('name', newUserName);
    formData.append('role', newUserRole);
    formData.append('mustChangePassword', 'true'); // NEW: Explicitly set mustChangePassword to true

    if (showOptionalProfileFields) {
      if (editUserPosition) formData.append('position', editUserPosition);
      if (editUserPhone) formData.append('phone', editUserPhone);
      if (editUserOrcid) formData.append('orcid', editUserOrcid);
      if (editUserBiography) formData.append('biography', editUserBiography);
      formData.append('expertises', JSON.stringify(editUserExpertises));
      formData.append('researchInterests', JSON.stringify(editUserResearchInterests));
      formData.append('universityEducation', JSON.stringify(editUniversityEducation));
      if (newExpirationDate) formData.append('expirationDate', newExpirationDate);
    }


    if (croppedImageFile) {
      formData.append('profileImage', croppedImageFile, initialSelectedFile?.name || 'cropped_image.jpeg');
    } else if (initialSelectedFile) {
      formData.append('profileImage', initialSelectedFile);
    }

    try {
      const createdUser = await apiCreateUser(formData, token!);

      setToast({ message: createdUser ? `Utilisateur ${createdUser.name || createdUser.email} créé avec succès !` : 'Utilisateur créé avec succès !', type: 'success' });

      // Clear form fields
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserRole('member');
      handleClearImage();
      setEditUserPosition('');
      setEditUserPhone('');
      setEditUserOrcid('');
      setEditUserBiography('');
      setEditUserExpertises([]);
      setEditUserResearchInterests([]);
      setEditUniversityEducation([]);
      setNewExpertiseItem('');
      setNewResearchInterestItem('');
  setNewUniversityEducationItem({ degree: '', institution: '', year: '' });
      setNewExpirationDate('');
      setShowOptionalProfileFields(false);

      fetchUsers(false); // Refresh the list of users, suppress "chargées avec succès" toast
    } catch (err: any) {
      setErrorModal({ brief: 'Échec de la création de l\'utilisateur.', detailed: err.message || 'Une erreur inconnue est survenue.', visible: true });
      console.error('Error creating user:', err);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === loggedInUserId) {
      setErrorModal({ brief: 'Action non autorisée.', detailed: 'Vous ne pouvez pas supprimer votre propre compte.', visible: true });
      return;
    }

    setDeletingUser(userId); // Use this to open modal and set user to delete
  };

  // Function to confirm delete after modal
  const confirmDeleteUser = async () => {
    if (!deletingUser || !token) {
      return;
    }

    setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals
    setArchivingUser(true); // Reusing this for loading state in modal, maybe change later

    try {
      await deleteUser(deletingUser, token!);
      setToast({ message: 'Utilisateur supprimé avec succès !', type: 'success' });
      fetchUsers(false); // Refresh the list of users, suppress "chargées avec succès" toast
      setDeletingUser(null); // Close modal
    } catch (err: any) {
      setErrorModal({ brief: 'Échec de la suppression de l\'utilisateur.', detailed: err.message || 'Une erreur inconnue est survenue.', visible: true });
      console.error('Error deleting user:', err);
    } finally {
      setArchivingUser(false); // Reset loading state
    }
  };


  const startEditingUser = (user: UserType) => {
    setEditingUser(user);
    setEditUserEmail(user.email);
    setEditUserName(user.name || '');
    setEditUserRole(user.role);
    setEditUserPassword('');

    setEditUserPosition(user.position || '');
    setEditUserPhone(user.phone || '');
    setEditUserOrcid(user.orcid || '');
    setEditUserBiography(user.biography || '');
    setEditUserExpertises(Array.isArray(user.expertises) ? user.expertises : []);
    setEditUserResearchInterests(Array.isArray(user.researchInterests) ? user.researchInterests : []);
    setEditUniversityEducation(Array.isArray(user.universityEducation) ? user.universityEducation : []);


    setEditExpirationDate(user.expirationDate ? new Date(user.expirationDate).toISOString().split('T')[0] : '');

    setImagePreviewUrl(user.image || null);
    setInitialSelectedFile(null);
    setSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setCroppedImageFile(null);

    console.log(`Editing user '${user.email}' original image URL:`, user.image);
    if (user.image && user.image.startsWith('/uploads')) {
        console.log(`Editing user '${user.email}' constructed image URL for preview:`, BACKEND_BASE_URL + user.image);
    }

const hasOptionalContent =
  (Array.isArray(user.expertises) && user.expertises.length > 0) ||
  (Array.isArray(user.researchInterests) && user.researchInterests.length > 0) ||
  (Array.isArray(user.universityEducation) && user.universityEducation.length > 0);
setShowOptionalProfileFields(!!hasOptionalContent);

    setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals
    setCurrentView('edit');
  };

  const handleGoBack = () => {
    setEditingUser(null);
    setEditUserEmail('');
    setEditUserName('');
    setEditUserRole('member');
    setEditUserPassword('');
    setEditUserPosition('');
    setEditUserPhone('');
    setEditUserOrcid('');
    setEditUserBiography('');
    setEditUserExpertises([]);
    setEditUserResearchInterests([]);
    setEditUniversityEducation([]);
    setNewExpertiseItem('');
    setNewResearchInterestItem('');
  setNewUniversityEducationItem({ degree: '', institution: '', year: '' });
    setEditExpirationDate('');

    handleClearImage();
    setShowOptionalProfileFields(false);

    // setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals
    setCurrentView('list');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;

      setUpdatingUser(true);
      setToast(null); // Clear previous toasts
      setErrorModal(null); // Clear previous error modals

      const formData = new FormData();
      formData.append('name', editUserName || '');
      formData.append('role', editUserRole);
      formData.append('position', editUserPosition || '');
      formData.append('phone', editUserPhone || '');
      if (editUserOrcid !== (editingUser.orcid ?? '')) {
          formData.append('orcid', editUserOrcid);
      }
      formData.append('biography', editUserBiography || '');
      formData.append('expertises', JSON.stringify(editUserExpertises));
      formData.append('researchInterests', JSON.stringify(editUserResearchInterests));
      formData.append('universityEducation', JSON.stringify(editUniversityEducation));

      formData.append('expirationDate', editExpirationDate || '');


      if (editUserPassword) {
        formData.append('password', editUserPassword);
        formData.append('mustChangePassword', 'false');
      } else {
        formData.append('mustChangePassword', editingUser.mustChangePassword ? 'true' : 'false');
      }

      if (croppedImageFile) {
        formData.append('profileImage', croppedImageFile, initialSelectedFile?.name || 'cropped_image.jpeg');
      } else if (initialSelectedFile) {
        formData.append('profileImage', initialSelectedFile);
      } else if (imagePreviewUrl === null && editingUser.image) {
        formData.append('image', '');
      }
      else if (editingUser.image && imagePreviewUrl) {
          formData.append('image', editingUser.image);
      }


      try {
        const updatedUser = await apiUpdateUser(editingUser.id, formData, token!);
        setToast({ message: updatedUser ? `Utilisateur ${updatedUser.name || updatedUser.email} mis à jour avec succès !` : 'Utilisateur mis à jour avec succès !', type: 'success' });
         setTimeout(() => {
      setToast(null); // Clear the toast after 3 seconds
    }, 3000); // 3000 milliseconds = 3 seconds
        fetchUsers(false); // Refresh the list of users, suppress "chargées avec succès" toast
        handleGoBack();
      } catch (err: any) {
        setErrorModal({ brief: 'Échec de la mise à jour de l\'utilisateur.', detailed: err.message || 'Une erreur inconnue est survenue.', visible: true });
        console.error('Error updating user:', err);
      } finally {
        setUpdatingUser(false);
      }
  };

  const handleAddArrayItem = useCallback(<T extends {}>(setter: React.Dispatch<React.SetStateAction<T[]>>, newItem: T, newItemSetter: React.Dispatch<React.SetStateAction<T>>) => {
    // Check if the newItem is an empty object before adding it to prevent adding blank entries.
    const isObjectEmpty = Object.values(newItem).every(val => val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val)));
    if (!isObjectEmpty) {
      setter(prevItems => [...prevItems, newItem]);
      // Reset the newItem state to a new, empty object with the correct type.
      newItemSetter({} as T);
    } else {
      // You can add a toast or a log here to inform the user that they cannot add an empty item.
      console.error("Cannot add an empty item to the array.");
    }
  }, []);


  const handleRemoveArrayItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, indexToRemove: number) => {
  setter(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
};

  const isUserExpired = (user: UserType): boolean => {
    if (!user.expirationDate) return false;
    const expirationDate = new Date(user.expirationDate);
    const today = new Date();
    // Set both to start of day to compare only dates, not time
    expirationDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return expirationDate <= today;
  };

  // --- NEW: Handle Archive User ---
  const handleArchiveUser = async () => {
    if (!confirmArchiveUserId || !token) {
      return;
    }

    setArchivingUser(true);
    setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals

    const formData = new FormData();
    // Set expiration date to a very old date (e.g., 1970-01-01) to "archive"
    formData.append('expirationDate', '1970-01-01');

    try {
      const archivedUser = await apiUpdateUser(confirmArchiveUserId, formData, token!);
      setToast({ message: archivedUser ? `Utilisateur ${archivedUser.name || archivedUser.email} archivé avec succès !` : 'Utilisateur archivé avec succès !', type: 'success' });
      fetchUsers(false); // Re-fetch users to reflect the change, suppress "chargées avec succès" toast
      setConfirmArchiveUserId(null); // Close the modal
    } catch (err: any) {
      setErrorModal({ brief: 'Échec de l\'archivage de l\'utilisateur.', detailed: err.message || 'Une erreur inconnue est survenue.', visible: true });
      console.error('Error archiving user:', err);
    } finally {
      setArchivingUser(false);
    }
  };
  // --- END NEW: Handle Archive User ---

  // --- NEW: Handle Send Credentials Email ---
  const handleSendCredentialsEmail = async (user: UserType) => {
    if (!token) {
      setErrorModal({ brief: 'Authentification requise.', detailed: 'Jeton d\'authentification manquant.', visible: true });
      return;
    }
    setSendingCredentialsUserId(user.id!); // Set loading state for this specific user
    setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals

    try {
      const response = await sendUserCredentials(user.id!, token);
      if (response.success) {
        setToast({ message: response.message || `Identifiants envoyés à ${user.email} avec succès !`, type: 'success' });
        // Re-fetch users to update the 'Changer mdp ?' column, as backend sets mustChangePassword to true
        fetchUsers(false);
      } else {
        throw new Error(response.message || 'Échec de l\'envoi des identifiants.');
      }
    } catch (err: any) {
      setErrorModal({ brief: 'Échec de l\'envoi des identifiants.', detailed: err.message || 'Une erreur inconnue est survenue lors de l\'envoi de l\'email.', visible: true });
      console.error('Error sending credentials email:', err);
    } finally {
      setSendingCredentialsUserId(null); // Clear loading state
    }
  };
  // --- END NEW: Handle Send Credentials Email ---


  // --- Export CSV Logic ---
  const handleExportUsers = async () => {
    setExportingCsv(true);
    setToast(null); // Clear previous toasts
    setErrorModal(null); // Clear previous error modals

    if (selectedExportFields.length === 0) {
      setErrorModal({ brief: 'Aucun champ sélectionné.', detailed: 'Veuillez sélectionner au moins un champ à exporter.', visible: true });
      setExportingCsv(false);
      return;
    }

    try {
      // Fetch ALL users, ignoring current pagination or search filters
      const allUsers = await getAllUsers(token!, true);

      const headers = selectedExportFields.map(key => {
        const field = exportableUserFields.find(f => f.key === key);
        return escapeCsvValue(field ? field.label : key); // Use label if available, otherwise key
      }).join(';'); // Use semicolon as delimiter for French Excel compatibility

  const rows = allUsers.data.map((user: UserType) => {
        return selectedExportFields.map(key => {
          // Access nested properties if necessary (though current UserType is flat)
          const value = (user as any)[key]; // Use (user as any) to allow dynamic key access
          return escapeCsvValue(value);
        }).join(';'); // Use semicolon as delimiter
      }).join('\n');

      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const today = new Date().toISOString().split('T')[0]; //YYYY-MM-DD
      const filename = `users_export_${today}.csv`;

      // Create a link element and trigger download
      const link = document.createElement('a');
      if (link.download !== undefined) { // Feature detection for HTML5 download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
      } else {
        // Fallback for browsers that do not support download attribute
        // This might prompt the user to save or display the CSV content
        window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      }

      setToast({ message: 'Exportation CSV réussie !', type: 'success' });
      setShowExportModal(false); // Close modal after successful export
    } catch (error: any) {
      console.error('Error during CSV export:', error);
      setErrorModal({ brief: 'Échec de l\'exportation CSV.', detailed: `Détails: ${error.message || 'Erreur inconnue'}`, visible: true });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportFieldChange = (key: string, isChecked: boolean) => {
    setSelectedExportFields(prev =>
      isChecked ? [...prev, key] : prev.filter(field => field !== key)
    );
  };
  // --- End Export CSV Logic ---


  if (isAuthLoading || loadingUsers) {
    return (
      <div className={`flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 ${inter.className}`}>
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <p className="ml-4 text-lg text-gray-700">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <div className={`flex min-h-[calc(100vh-80px)] items-center justify-center bg-red-100 text-red-700 p-8 ${inter.className}`}>
        <p className="text-lg">Accès non autorisé. Seuls les administrateurs peuvent gérer les utilisateurs.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className="mb-10 text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
            <User className="w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl font-extrabold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-lg text-white">Gérez les comptes des membres et des administrateurs.</p>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error Modal */}
      {errorModal && errorModal.visible && (
        <ErrorModal
          briefDescription={errorModal.brief}
          detailedError={errorModal.detailed}
          onClose={() => setErrorModal(null)}
        />
      )}

      {currentView === 'list' && (
        <> {/* Added a Fragment here to wrap multiple top-level elements */}
          <div className="w-full bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <PlusCircle className="w-6 h-6 mr-3 text-blue-600" /> Ajouter un nouvel utilisateur
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    id="newEmail"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="utilisateur@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="newPassword"
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Mot de passe"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Générer un mot de passe fort"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">Nom (Optionnel)</label>
                <input
                  type="text"
                  id="newName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nom de l'utilisateur"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  id="newRole"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'member')}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label htmlFor="profileImage" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                  <UploadCloud className="w-4 h-4 mr-2 text-gray-500" /> Télécharger une image de profil (Optionnel)
                </label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />

                {src && (
                  <div className="mt-4 p-4 border rounded-md bg-gray-50 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-700 mb-2 font-semibold">Recadrer l'image :</p>
                    <ReactCrop
                      crop={crop}
                      onChange={onCropChange}
                      onComplete={handleCropComplete}
                      aspect={1}
                      circularCrop={true}
                      minWidth={50}
                      minHeight={50}
                    >
                      <img ref={imgRef} alt="Source" src={src} onLoad={onImageLoad} className="max-w-full h-auto rounded-md shadow-sm" />
                    </ReactCrop>
                    <div className="flex justify-center space-x-2 mt-4 w-full">
                      {src && completedCrop && (
                        <button
                          type="button"
                          onClick={handleApplyCrop}
                          className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Appliquer le recadrage
                        </button>
                      )}
                      <button
                          type="button"
                          onClick={handleClearImage}
                          className="inline-flex items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Annuler / Effacer la sélection
                        </button>
                    </div>
                  </div>
                )}

                {imagePreviewUrl && !src && (
                  <div className="mt-4 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-700 mb-2">Aperçu de l'image actuelle:</p>
                    <img src={imagePreviewUrl} alt="Aperçu" className="h-32 w-32 object-cover rounded-md shadow-sm" />
                    <button
                       type="button"
                       onClick={handleClearImage}
                       className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Supprimer l'image
                    </button>
                  </div>
                )}
                {!imagePreviewUrl && !src && (
                  <div className="mt-4 text-gray-500 text-sm">Pas d'image de profil sélectionnée.</div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={toggleOptionalProfileFields}
                  className="w-full flex justify-between items-center text-lg font-semibold text-gray-800 focus:outline-none"
                >
                  Informations de profil (optionnel)
                  {showOptionalProfileFields ? <ChevronUp className="h-5 w-5 ml-2" /> : <ChevronDown className="h-5 w-5 ml-2" />}
                </button>

                {showOptionalProfileFields && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="newPosition" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-gray-500" /> Position
                      </label>
                      <input
                        type="text"
                        id="newPosition"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ex: Professeur, Chercheur, Doctorant"
                        value={editUserPosition}
                        onChange={(e) => setEditUserPosition(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="newPhone" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" /> Téléphone
                      </label>
                      <input
                        type="text"
                        id="newPhone"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ex: +216 12 345 678"
                        value={editUserPhone}
                        onChange={(e) => setEditUserPhone(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="newOrcid" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <LinkIcon className="w-4 h-4 mr-2 text-gray-500" /> ORCID
                      </label>
                      <input
                        type="text"
                        id="newOrcid"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ex: 0000-0002-1825-0097"
                        value={editUserOrcid}
                        onChange={(e) => setEditUserOrcid(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="newBiography" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <AlignLeft className="w-4 h-4 mr-2 text-gray-500" /> Biographie
                      </label>
                      <textarea
                        id="newBiography"
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Écrivez une courte biographie..."
                        value={editUserBiography}
                        onChange={(e) => setEditUserBiography(e.target.value)}
                      ></textarea>
                    </div>

                    <div>
                      <label className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <Lightbulb className="w-4 h-4 mr-2 text-gray-500" /> Expertises
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editUserExpertises.map((expertise, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {expertise}
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem(setEditUserExpertises, index)}
                              className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                              title="Supprimer cette expertise"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Ajouter une expertise..."
                          value={newExpertiseItem}
                          onChange={(e) => setNewExpertiseItem(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newExpertiseItem.trim() !== '') {
                              setEditUserExpertises(prev => [...prev, newExpertiseItem.trim()]);
                              setNewExpertiseItem('');
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" /> Intérêts de recherche
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editUserResearchInterests.map((interest, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {interest}
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem(setEditUserResearchInterests, index)}
                              className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                              title="Supprimer cet intérêt"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Ajouter un intérêt de recherche..."
                          value={newResearchInterestItem}
                          onChange={(e) => setNewResearchInterestItem(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newResearchInterestItem.trim() !== '') {
                              setEditUserResearchInterests(prev => [...prev, newResearchInterestItem.trim()]);
                              setNewResearchInterestItem('');
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <GraduationCap className="w-4 h-4 mr-2 text-gray-500" /> Formation universitaire
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editUniversityEducation.map((education, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {`${education.degree} from ${education.institution} (${education.year})`}
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem(setEditUniversityEducation, index)}
                              className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                              title="Supprimer cette formation"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2 w-full">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Diplôme (ex: Doctorat)"
                          value={newUniversityEducationItem?.degree || ''}
                          onChange={e => setNewUniversityEducationItem(prev => ({ ...prev, degree: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Institution (ex: Université de Monastir)"
                          value={newUniversityEducationItem?.institution || ''}
                          onChange={e => setNewUniversityEducationItem(prev => ({ ...prev, institution: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Année (ex: 2024)"
                          value={newUniversityEducationItem?.year || ''}
                          onChange={e => setNewUniversityEducationItem(prev => ({ ...prev, year: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              newUniversityEducationItem?.degree?.trim() &&
                              newUniversityEducationItem?.institution?.trim() &&
                              newUniversityEducationItem?.year?.trim()
                            ) {
                              setEditUniversityEducation(prev => [
                                ...prev,
                                {
                                  degree: newUniversityEducationItem.degree.trim(),
                                  institution: newUniversityEducationItem.institution.trim(),
                                  year: newUniversityEducationItem.year.trim(),
                                },
                              ]);
                              setNewUniversityEducationItem({ degree: '', institution: '', year: '' });
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="newExpirationDate" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" /> Date d'expiration (YYYY-MM-DD, Optionnel)
                      </label>
                      <input
                        type="date"
                        id="newExpirationDate"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newExpirationDate}
                        onChange={(e) => setNewExpirationDate(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Laisser vide pour une expiration automatique de 5 ans à partir de la date de création.
                        Définir une date pour annuler l'expiration automatique.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={creatingUser}
            >
              {creatingUser ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <PlusCircle className="h-5 w-5 mr-2" />
              )}
              {creatingUser ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </form>
        </div>

          <div className="w-full bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-6 h-6 mr-3 text-blue-600" /> Tous les utilisateurs ({filteredUsers.length})
            </h2>

            {/* Filter by Expired Users, Export Button & Users Per Page Control */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showExpiredUsers"
                  checked={showExpiredUsers}
                  onChange={(e) => {
                    setShowExpiredUsers(e.target.checked);
                    setCurrentPage(1); // Reset page when filter changes
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showExpiredUsers" className="text-sm font-medium text-gray-700">
                  Afficher les utilisateurs expirés
                </label>
              </div>

              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={exportingCsv || loadingUsers || users.length === 0}
              >
                {exportingCsv ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                Exporter le tableau ( .csv )
              </button>

              {/* Users Per Page Dropdown */}
              <div className="flex items-center space-x-2">
                <label htmlFor="usersPerPage" className="text-sm font-medium text-gray-700">
                  Utilisateurs par page:
                </label>
                <select
                  id="usersPerPage"
                  value={usersPerPage}
                  onChange={(e) => {
                    setUsersPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page whenever page size changes
                  }}
                  className="mt-1 block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {usersPerPageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>


            {/* Search Input */}
            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    placeholder="Rechercher par nom, email ou position..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Nom
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Rôle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Téléphone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Image
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      ORCID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Removed whitespace-nowrap */}
                      Expertises
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Removed whitespace-nowrap */}
                      Intérêts de Recherche
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Removed whitespace-nowrap */}
                      Formation Universitaire
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Removed whitespace-nowrap */}
                      Date d'expiration
                    </th>
                    <th scope="col" className="relative px-6 py-3 whitespace-nowrap">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => {
                    const isExpired = isUserExpired(user);
                    return (
                    <tr key={user.id} className={isExpired ? 'bg-red-50 text-gray-500' : ''}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {user.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {user.position || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {user.phone || 'N/A'}
                      </td>
                       {/* Image Preview Column Data */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={`${user.name || user.email}'s profile`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const span = document.createElement('span');
                              span.className = 'text-gray-400 text-xs';
                              span.textContent = 'Erreur chargement';
                              e.currentTarget.parentNode?.appendChild(span);
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">Pas d'image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {user.orcid || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500"> {/* Removed whitespace-nowrap */}
                        {(user.expertises ?? []).length > 0 ? (
                          <div className="flex flex-nowrap gap-1">
                            {(user.expertises ?? []).map((exp, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {exp}
                              </span>
                            ))}
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500"> {/* Removed whitespace-nowrap */}
                        {(user.researchInterests ?? []).length > 0 ? (
                          <div className="flex flex-nowrap gap-1">
                            {(user.researchInterests ?? []).map((interest, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {interest}
                              </span>
                            ))}
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500"> {/* Removed whitespace-nowrap */}
                        {(user.universityEducation ?? []).length > 0 ? (
                          <div className="flex flex-nowrap gap-1">
                            {(user.universityEducation ?? []).map((edu, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {typeof edu === 'object' && edu !== null
                                  ? `${edu.degree || ''}${edu.degree && edu.institution ? ' from ' : ''}${edu.institution || ''}${(edu.degree || edu.institution) && edu.year ? ` (${edu.year})` : ''}`
                                  : String(edu)}
                              </span>
                            ))}
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isExpired ? 'text-red-700 font-semibold' : 'text-gray-500'}`}> {/* Removed whitespace-nowrap */}
                        {user.expirationDate ? user.expirationDate : 'Jamais'}
                        {isExpired && <span className="ml-2 text-xs text-red-500">(Expiré)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2"> {/* Added flex container for buttons */}
                          {/* Send Credentials Button */}
                          <button
                            onClick={() => handleSendCredentialsEmail(user)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                            title="Envoyer les identifiants par email"
                            disabled={sendingCredentialsUserId === user.id} // Disable while sending for this user
                          >
                            {sendingCredentialsUserId === user.id ? (
                              <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>

                          <button
                            onClick={() => startEditingUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full hover:bg-indigo-100 transition-colors"
                            title="Modifier"
                            disabled={updatingUser}
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>

                          {/* Archive Button */}
                          {user.id !== loggedInUserId && !isExpired && ( // Cannot archive self or already archived users
                            <button
                              onClick={() => setConfirmArchiveUserId(user.id)}
                              className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full hover:bg-yellow-100 transition-colors"
                              title="Archiver l'utilisateur"
                              disabled={archivingUser || deletingUser === user.id}
                            >
                              <Archive className="w-5 h-5" />
                            </button>
                          )}

                          {user.id === loggedInUserId ? (
                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-xs" title="Vous ne pouvez pas supprimer votre propre compte.">
                              Ce Compte
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full hover:bg-red-100 transition-colors"
                              title="Supprimer"
                              disabled={deletingUser === user.id || updatingUser || archivingUser}
                            >
                              {deletingUser === user.id ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
            {currentUsers.length === 0 && !loadingUsers && !userError && (
              <div className="text-center text-gray-600 py-6">Aucun utilisateur trouvé.</div>
            )}

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
                <nav className="flex justify-center items-center space-x-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Précédent
                    </button>
                    <span className="text-gray-700 text-sm">Page {currentPage} sur {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Suivant
                    </button>
                </nav>
            )}
          </div>
        </>
      )}

      {currentView === 'edit' && editingUser && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative">
          <button
            onClick={handleGoBack}
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retourner
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 mt-12">Modifier l'utilisateur: {editingUser.email}</h2>
          <form onSubmit={handleUpdateUser} className=" space-y-6">
            <div>
              <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="editEmail"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                value={editUserEmail}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">L'adresse email ne peut pas être modifiée.</p>
            </div>
            <div>
              <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                id="editName"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nom de l'utilisateur"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="editRole" className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                id="editRole"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value as 'admin' | 'member')}
              >
                <option value="member">Membre</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label htmlFor="editProfileImage" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                <UploadCloud className="w-4 h-4 mr-2 text-gray-500" /> Télécharger une nouvelle image de profil (Optionnel)
              </label>
              <input
                type="file"
                id="editProfileImage"
                name="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />

              {src && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50 flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-700 mb-2 font-semibold">Recadrer l'image :</p>
                  <ReactCrop
                    crop={crop}
                    onChange={onCropChange}
                    onComplete={handleCropComplete}
                    aspect={1}
                    circularCrop={true}
                    minWidth={50}
                    minHeight={50}
                  >
                    <img ref={imgRef} alt="Source" src={src} onLoad={onImageLoad} className="max-w-full h-auto rounded-md shadow-sm" />
                  </ReactCrop>
                  <div className="flex justify-center space-x-2 mt-4 w-full">
                    {src && completedCrop && (
                      <button
                        type="button"
                        onClick={handleApplyCrop}
                        className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Appliquer le recadrage
                      </button>
                    )}
                    <button
                        type="button"
                        onClick={handleClearImage}
                        className="inline-flex items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Annuler / Effacer la sélection
                      </button>
                  </div>
                </div>
              )}

              {imagePreviewUrl && !src ? (
                <div className="mt-4 flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-700 mb-2">Aperçu de l'image actuelle:</p>
                  <img
                    src={imagePreviewUrl}
                    alt="Aperçu de l'image"
                    className="h-32 w-32 object-cover rounded-md shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const span = document.createElement('span');
                      span.className = 'text-red-600 text-sm';
                      span.textContent = 'Erreur de chargement de l\'image';
                      e.currentTarget.parentNode?.appendChild(span);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Supprimer l'image actuelle
                  </button>
                </div>
              ) : (
                !imagePreviewUrl && !src && <div className="mt-4 text-gray-500 text-sm">Pas d'image de profil.</div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={toggleOptionalProfileFields}
                className="w-full flex justify-between items-center text-lg font-semibold text-gray-800 focus:outline-none"
              >
                Informations de profil (optionnel)
                {showOptionalProfileFields ? <ChevronUp className="h-5 w-5 ml-2" /> : <ChevronDown className="h-5 w-5 ml-2" />}
              </button>

              {showOptionalProfileFields && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label htmlFor="editPosition" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <Briefcase className="w-4 h-4 mr-2 text-gray-500" /> Position
                    </label>
                    <input
                      type="text"
                      id="editPosition"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ex: Professeur, Chercheur, Doctorant"
                      value={editUserPosition}
                      onChange={(e) => setEditUserPosition(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="editPhone" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" /> Téléphone
                    </label>
                    <input
                      type="text"
                      id="editPhone"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ex: +216 12 345 678"
                      value={editUserPhone}
                      onChange={(e) => setEditUserPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="editOrcid" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <LinkIcon className="w-4 h-4 mr-2 text-gray-500" /> ORCID
                    </label>
                    <input
                      type="text"
                      id="editOrcid"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ex: 0000-0002-1825-0097"
                      value={editUserOrcid}
                      onChange={(e) => setEditUserOrcid(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="editBiography" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <AlignLeft className="w-4 h-4 mr-2 text-gray-500" /> Biographie
                    </label>
                    <textarea
                      id="editBiography"
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Écrivez une courte biographie..."
                      value={editUserBiography}
                      onChange={(e) => setEditUserBiography(e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <Lightbulb className="w-4 h-4 mr-2 text-gray-500" /> Expertises
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editUserExpertises.map((expertise, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {expertise}
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem(setEditUserExpertises, index)}
                            className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                            title="Supprimer cette expertise"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ajouter une expertise..."
                        value={newExpertiseItem}
                        onChange={(e) => setNewExpertiseItem(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddArrayItem(setEditUserExpertises, newExpertiseItem, setNewExpertiseItem)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" /> Intérêts de recherche
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editUserResearchInterests.map((interest, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {interest}
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem(setEditUserResearchInterests, index)}
                            className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                            title="Supprimer cet intérêt"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ajouter un intérêt de recherche..."
                        value={newResearchInterestItem}
                        onChange={(e) => setNewResearchInterestItem(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddArrayItem(setEditUserResearchInterests, newResearchInterestItem, setNewResearchInterestItem)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-gray-500" /> Formation universitaire
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editUniversityEducation.map((education, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {education}
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem(setEditUniversityEducation, index)}
                            className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                            title="Supprimer cette formation"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2"
                        placeholder="Diplôme (ex: Doctorat, Master...)"
                        value={newUniversityEducationItem.degree}
                        onChange={(e) => setNewUniversityEducationItem({ ...newUniversityEducationItem, degree: e.target.value })}
                      />
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2"
                        placeholder="Établissement (ex: Université de Paris)"
                        value={newUniversityEducationItem.institution}
                        onChange={(e) => setNewUniversityEducationItem({ ...newUniversityEducationItem, institution: e.target.value })}
                      />
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2"
                        placeholder="Année (ex: 2022)"
                        value={newUniversityEducationItem.year}
                        onChange={(e) => setNewUniversityEducationItem({ ...newUniversityEducationItem, year: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddArrayItem(setEditUniversityEducation, newUniversityEducationItem, setNewUniversityEducationItem)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="editExpirationDate" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" /> Date d'expiration (YYYY-MM-DD, Optionnel)
                    </label>
                    <input
                      type="date"
                      id="editExpirationDate"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editExpirationDate}
                      onChange={(e) => setEditExpirationDate(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Définir une date future pour prolonger l'accès. Laisser vide pour une gestion automatique via l'activité.
                      Définir une date passée rendra l'utilisateur expiré.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 relative">
              <label htmlFor="editPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe (Laisser vide pour ne pas changer)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="editPassword"
                  name="editPassword"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder=" Nouveau mot de passe"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-1"
                    title="Générer un mot de passe fort"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={updatingUser}
            >
              {updatingUser ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <Edit3 className="h-5 w-5 mr-2" />
              )}
              {updatingUser ? 'Mise à jour...' : 'Mettre à jour l\'utilisateur'}
            </button>
          </form>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Sélectionner les champs à exporter</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choisissez les colonnes que vous souhaitez inclure dans le fichier Excel (CSV).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
              {exportableUserFields.map(field => (
                <div key={field.key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`export-field-${field.key}`}
                    checked={selectedExportFields.includes(field.key)}
                    onChange={(e) => handleExportFieldChange(field.key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`export-field-${field.key}`} className="ml-2 text-sm text-gray-700">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
            {selectedExportFields.length === 0 && (
              <p className="text-red-500 text-sm mt-4">Veuillez sélectionner au moins un champ.</p>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExportUsers}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exportingCsv || selectedExportFields.length === 0}
              >
                {exportingCsv ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                Exporter le tableau ( .csv )
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Refactored to use generic modal structure */}
      {deletingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setDeletingUser(null)} // Close modal
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={archivingUser} // Reusing archivingUser for loading state
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteUser} // Call the actual delete logic
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={archivingUser} // Reusing archivingUser for loading state
              >
                {archivingUser ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2 inline-block" />
                )}
                {archivingUser ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Archive Confirmation Modal */}
      {confirmArchiveUserId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Archive className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Confirmer l'archivage</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir archiver cet utilisateur ? Son compte restera mais son accès expirera immédiatement.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmArchiveUserId(null)} // Close modal
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={archivingUser}
              >
                Annuler
              </button>
              <button
                onClick={handleArchiveUser} // Call the actual archive logic
                className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={archivingUser}
              >
                {archivingUser ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                ) : (
                  <Archive className="h-4 w-4 mr-2 inline-block" />
                )}
                {archivingUser ? 'Archivage...' : 'Archiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

