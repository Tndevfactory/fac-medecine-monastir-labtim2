'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Inter } from 'next/font/google';
import { ExternalLink, User as UserIcon, Mail, Briefcase, Phone, BookOpen, GraduationCap, LinkIcon, Edit, Save, X as CloseIcon, PlusCircle, Trash2, Loader2, UploadCloud, Info as InfoIcon, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'; // Added Lock, Eye, EyeOff
import Image from 'next/image';
import { User, UserRole } from '@/types/index'; // Assuming User type is defined here
import { updateUserProfile } from '@/services/dashboardApi';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';
import { changePassword, initialPasswordSetup } from '@/services/authApi'; // Import authApi functions

// Import for react-image-crop
import ReactCrop, { Crop, PixelCrop, PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const inter = Inter({ subsets: ['latin'] });

interface MemberProfileEditProps {
  initialUser: User; // Pass the user data from the page
  onProfileUpdated?: (updatedUser: User, newToken?: string) => void; // Callback for parent
  isEditable?: boolean; // Prop to control editability (e.g., based on user role)
}

// Helper to get a cropped image from a canvas (copied from UserManagement.tsx)
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

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5000';


const MemberProfileEdit: React.FC<MemberProfileEditProps> = ({ initialUser, onProfileUpdated, isEditable = false }) => {
  const { token, user: loggedInUser, login } = useAuth();
  
  const [member, setMember] = useState<User>(initialUser);
  const [originalMember, setOriginalMember] = useState<User>(initialUser);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  const [newExpertise, setNewExpertise] = useState('');
  const [newResearchInterest, setNewResearchInterest] = useState('');
  const [newUniversityEducation, setNewUniversityEducation] = useState('');

  // Image cropping states
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string | null>(null); // Source URL for ReactCrop
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<Blob | null>(null);
  const [initialSelectedFile, setInitialSelectedFile] = useState<File | null>(null); // To keep track of the original file name/type
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // URL for the final preview image
  const [isCropModalOpen, setIsCropModalOpen] = useState(false); // NEW: State to control cropping modal visibility

  // Password Change Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = isEditable && loggedInUser && 
                  (loggedInUser.role === 'admin' || loggedInUser.id === initialUser.id);

  useEffect(() => {
    setMember(initialUser);
    setOriginalMember(initialUser);
    // Set initial image preview, handling backend URL prefix
    setImagePreviewUrl(initialUser.image ? `${BACKEND_BASE_URL}${initialUser.image}` : '/images/avatar-placeholder.png');
    setIsEditing(false);
    // Clear all image related states on initialUser change
    setSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setCroppedImageFile(null);
    setInitialSelectedFile(null);
    setIsCropModalOpen(false); // Ensure modal is closed on initialUser change
  }, [initialUser]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMember(prev => ({ ...prev, [name]: value }));
  };

  const hasChanges = () => {
    const primitiveFieldsChanged = 
      member.name !== originalMember.name ||
      member.email !== originalMember.email ||
      member.position !== originalMember.position ||
      member.phone !== originalMember.phone ||
      member.biography !== originalMember.biography ||
      member.orcid !== originalMember.orcid;

    const arraysChanged = 
      JSON.stringify((member.expertises || []).sort()) !== JSON.stringify((originalMember.expertises || []).sort()) ||
      JSON.stringify((member.researchInterests || []).sort()) !== JSON.stringify((originalMember.researchInterests || []).sort()) ||
      JSON.stringify((member.universityEducation || []).sort()) !== JSON.stringify((originalMember.universityEducation || []).sort());

    // Check if a new image has been selected/cropped, or if the existing image was explicitly deleted
    const imageStatusChanged = 
      (croppedImageFile !== null) || // A new image has been cropped
      (initialSelectedFile !== null && croppedImageFile === null && src !== null) || // A new image was selected and is awaiting crop (src is not null)
      (member.image === null && originalMember.image !== null); // Existing image was deleted

    return primitiveFieldsChanged || arraysChanged || imageStatusChanged;
  };

  const handleAddItem = (field: 'expertises' | 'researchInterests' | 'universityEducation', newItem: string, setNewItem: React.Dispatch<React.SetStateAction<string>>) => {
    if (newItem.trim() === '') return;
    setMember(prev => ({
      ...prev,
      [field]: [...new Set([...(prev[field] || []), newItem.trim()])]
    }));
    setNewItem('');
  };

  const handleRemoveItem = (field: 'expertises' | 'researchInterests' | 'universityEducation', itemToRemove: string) => {
    setMember(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(item => item !== itemToRemove)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInitialSelectedFile(file);
      setCroppedImageFile(null);
      setCompletedCrop(null);
      setImagePreviewUrl(null); // Clear preview when new file is selected

      setCrop(undefined); // Reset crop state

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSrc(reader.result?.toString() || null);
        setIsCropModalOpen(true); // NEW: Open the cropping modal
      });
      reader.readAsDataURL(file);

    } else {
      // If no file selected (e.g., user cancels file dialog)
      setInitialSelectedFile(null);
      setSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
      setCroppedImageFile(null);
      setIsCropModalOpen(false); // NEW: Close modal if no file selected
      // Revert to original image or placeholder if no new file is chosen
      setImagePreviewUrl(originalMember.image ? `${BACKEND_BASE_URL}${originalMember.image}` : '/images/avatar-placeholder.png');
    }
  };

  const handleDeleteImage = () => {
  setMember(prev => ({ ...prev, image: '' })); // Mark for deletion on save
    setImagePreviewUrl('/images/avatar-placeholder.png'); // Show placeholder immediately
    setInitialSelectedFile(new File([], 'DELETE_IMAGE')); // Use a dummy file to signal deletion
    setSrc(null); // Clear cropping UI
    setCrop(undefined);
    setCompletedCrop(null);
    setCroppedImageFile(null);
    setIsCropModalOpen(false); // NEW: Close modal on delete
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // React-image-crop callbacks
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    // Use rendered width and height, not naturalWidth/Height, for responsive cropping
    const renderedWidth = e.currentTarget.width;
    const renderedHeight = e.currentTarget.height;

    console.log(`[DEBUG Cropping] Image loaded. Rendered dimensions: ${renderedWidth}px x ${renderedHeight}px`);

    // Calculate the size of the largest possible square that fits within the rendered image
    const size = Math.min(renderedWidth, renderedHeight);
    
    // Calculate x and y coordinates to center this square within the rendered image
    const x = (renderedWidth - size) / 2;
    const y = (renderedHeight - size) / 2;

    console.log(`[DEBUG Cropping] Calculated initial crop: x=${x}px, y=${y}px, width=${size}px, height=${size}px`);

    // Set crop to be a centered square with aspect ratio 1
    setCrop({
  unit: 'px',
  width: size,
  height: size,
  x: x,
  y: y
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
        setImagePreviewUrl(URL.createObjectURL(croppedBlob)); // Show cropped image preview
        setSrc(null); // Hide cropping UI
        setCrop(undefined);
        setCompletedCrop(null);
        setInitialSelectedFile(new File([croppedBlob], initialSelectedFile.name, { type: croppedBlob.type })); // Update initialSelectedFile to be the cropped one
        setIsCropModalOpen(false); // NEW: Close the cropping modal on apply
      } else {
        setToast({ message: 'Échec de la création de l\'image recadrée.', type: 'error' });
      }
    } else {
      setToast({ message: 'Impossible d\'appliquer le recadrage : image, recadrage terminé ou fichier initial manquant.', type: 'warning' });
    }
  };

  const handleCancelCrop = () => {
    setSrc(null); // Hide cropping UI
    setCrop(undefined);
    setCompletedCrop(null);
    setCroppedImageFile(null);
    setInitialSelectedFile(null); // Clear the selected file as well
    setIsCropModalOpen(false); // Close the cropping modal on cancel
    // Revert preview to the original member's image if it existed, otherwise to placeholder
    setImagePreviewUrl(originalMember.image ? `${BACKEND_BASE_URL}${originalMember.image}` : '/images/avatar-placeholder.png');
  };


  const handleSaveChanges = async () => {
    if (!token || !loggedInUser || !hasChanges()) {
      setToast({ message: 'Aucune modification à enregistrer.', type: 'info' });
      return;
    }

    setIsSaving(true);
    setToast(null);
    setErrorModal(null);

    try {
      const formData = new FormData();
      
      formData.append('name', member.name || '');
      formData.append('email', member.email || '');
      formData.append('position', member.position || '');
      formData.append('phone', member.phone || '');
      formData.append('biography', member.biography || '');
      formData.append('orcid', member.orcid || '');

      formData.append('expertises', JSON.stringify(member.expertises || []));
      formData.append('researchInterests', JSON.stringify(member.researchInterests || []));
      formData.append('universityEducation', JSON.stringify(member.universityEducation || []));

      // Handle image upload/deletion - CHANGED FIELD NAME TO 'profileImage'
      if (croppedImageFile) {
        // If an image was cropped, append the Blob as a File
        formData.append('profileImage', croppedImageFile, initialSelectedFile?.name || 'profile_image.jpeg');
      } else if (initialSelectedFile && initialSelectedFile.name === 'DELETE_IMAGE') {
        // If the image was explicitly deleted
        formData.append('profileImage', ''); // Send empty string to backend to clear image
      } else if (member.image === null && originalMember.image !== null) {
        // If the image was implicitly removed (e.g., by changing the field to null)
        formData.append('profileImage', '');
      } else if (originalMember.image && !initialSelectedFile) {
        // If no new file was selected and no deletion was explicitly signaled, keep the existing image
        formData.append('profileImage', originalMember.image);
      }
      // If initialSelectedFile exists but croppedImageFile is null and src is not null, it means
      // an image was selected but not yet cropped/applied. In this case, we should not send it yet.
      // The user must click 'Apply Crop' first. If they save without applying, the image won't be sent.


      const response = await updateUserProfile(member.id, formData, token);

      if (response.success && response.user) {
        setMember(response.user);
        setOriginalMember(response.user);
        setImagePreviewUrl(response.user.image ? `${BACKEND_BASE_URL}${response.user.image}` : '/images/avatar-placeholder.png');
        setInitialSelectedFile(null); // Clear original file
        setCroppedImageFile(null); // Clear cropped file
        setIsEditing(false);
        
        setToast({ message: response.message || 'Profil mis à jour avec succès !', type: 'success' });
        
        if (loggedInUser && loggedInUser.id === member.id && response.token) {
          login(response.token, response.user);
        } else if (loggedInUser && loggedInUser.id === member.id && response.user) {
          // If no new token but user data is returned, update auth context with current token and new user data
          // You might need to add a `setUser` function to AuthContext for this.
        }

        if (onProfileUpdated) {
          onProfileUpdated(response.user, response.token);
        }
      } else {
        setErrorModal({
          title: 'Échec de la mise à jour du profil',
          briefDescription: response.message || 'Une erreur est survenue lors de la mise à jour du profil.',
          detailedError: response.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setErrorModal({
        title: 'Erreur réseau ou serveur',
        briefDescription: 'Impossible de communiquer avec le serveur ou erreur inattendue.',
        detailedError: error.message || 'Veuillez vérifier votre connexion internet et réessayer.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change submission
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setErrorModal(null);
    setIsPasswordChanging(true);

    if (!token) {
      setToast({ message: 'Vous n\'êtes pas authentifié.', type: 'error' });
      setIsPasswordChanging(false);
      return;
    }

    // Only current user can change their password from this modal
    if (loggedInUser?.id !== member.id) {
        setToast({ message: 'Vous n\'êtes pas autorisé à changer le mot de passe de cet utilisateur.', type: 'error' });
        setIsPasswordChanging(false);
        return;
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setToast({ message: 'Veuillez remplir tous les champs du mot de passe.', type: 'warning' });
      setIsPasswordChanging(false);
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.', type: 'warning' });
      setIsPasswordChanging(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToast({ message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.', type: 'warning' });
      setIsPasswordChanging(false);
      return;
    }

    if (newPassword === oldPassword) {
      setToast({ message: 'Le nouveau mot de passe est identique à l\'ancien. Pour une meilleure sécurité, utilisez un mot de passe différent.', type: 'info' });
      // Allow submission, but with a warning.
    }

    try {
      // Use the changePassword API call
      const response = await changePassword(oldPassword, newPassword, token);

      if (response.success && response.token && response.user) {
        setToast({ message: 'Mot de passe mis à jour avec succès !', type: 'success' }); // Confirmed toast
        login(response.token, response.user); // Update AuthContext with new token and user data
        setShowPasswordModal(false); // Close the modal on success
        // Clear password fields
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setErrorModal({
          title: 'Échec de la mise à jour du mot de passe',
          briefDescription: response.message || 'Une erreur est survenue lors de la mise à jour du mot de passe.',
          detailedError: response.message,
        });
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setErrorModal({
        title: 'Erreur réseau ou serveur',
        briefDescription: 'Impossible de communiquer avec le serveur.',
        detailedError: err.message || 'Veuillez vérifier votre connexion internet et réessayer.',
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    if (field === 'old') setShowOldPassword(prev => !prev);
    else if (field === 'new') setShowNewPassword(prev => !prev);
    else if (field === 'confirm') setShowConfirmNewPassword(prev => !prev);
  };

  // Render a section with a title and content, handling editable state
  const renderSection = (title: string, Icon: React.ElementType, content: React.ReactNode) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"> {/* Updated h2 style */}
        <Icon className="h-6 w-6 mr-2 text-blue-600" /> {title}
      </h2>
      {content}
    </div>
  );

  // Render a field (input/textarea or text)
  const renderField = (label: string, value: string | null | undefined, name: string, Icon: React.ElementType, isTextArea: boolean = false) => {
    const isRoleField = name === 'role';
    const displayValue = value || 'Non spécifié';

    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
          <Icon className="h-5 w-5 text-gray-500 mr-2" /> {label}
        </h3>
        {isEditing && !isRoleField ? (
          isTextArea ? (
            <textarea
              name={name}
              value={value || ''}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              rows={4}
            />
          ) : (
            <input
              type="text"
              name={name}
              value={value || ''}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
          )
        ) : (
          <p className="text-gray-700">{displayValue}</p>
        )}
      </div>
    );
  };

  // Render an array field with add/remove functionality
  const renderArrayField = (label: string, field: 'expertises' | 'researchInterests' | 'universityEducation', newItemState: string, setNewItemState: React.Dispatch<React.SetStateAction<string>>, Icon: React.ElementType) => {
    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
          <Icon className="h-5 w-5 text-gray-500 mr-2" /> {label}
        </h3>
        {isEditing ? (
          <>
            <ul className="list-disc list-inside text-gray-700 mb-2">
              {(member[field] || []).map((item, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-1">
                  <span>
                    {typeof item === 'string'
                      ? item
                      : item && typeof item === 'object'
                        ? `${item.degree || ''} ${item.institution ? ' - ' + item.institution : ''} ${item.year ? '(' + item.year + ')' : ''}`.trim()
                        : ''}
                  </span>
                  {typeof item === 'string' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(field, item)}
                      className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={newItemState}
                onChange={(e) => setNewItemState(e.target.value)}
                placeholder={`Ajouter ${label.toLowerCase().includes('formation') ? 'une formation' : 'un élément'}`}
                className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem(field, newItemState, setNewItemState);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddItem(field, newItemState, setNewItemState)}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                title="Ajouter"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          member[field] && member[field].length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {(member[field] || []).map((item, index) => (
                <li key={index}>
                  {typeof item === 'string'
                    ? item
                    : item && typeof item === 'object'
                      ? `${item.degree || ''} ${item.institution ? ' - ' + item.institution : ''} ${item.year ? '(' + item.year + ')' : ''}`.trim()
                      : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700">Non spécifié</p>
          )
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-white ${inter.className}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => setErrorModal(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header with Name, Position and ORCID */}
        <div className="flex flex-col items-center text-center mb-8 relative"> {/* Centered for mobile first */}
          {/* Profile Image */}
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg mb-4 flex-shrink-0">
            <Image
              src={imagePreviewUrl || '/images/avatar-placeholder.png'}
              alt={`${member.name || 'User'}'s profile picture`}
              layout="fill"
              objectFit="cover"
              className="rounded-full"
              unoptimized={true}
              priority={true}
            />
            {canEdit && isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={triggerFileInput}
                  className="p-2 bg-white text-blue-600 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Changer l'image"
                >
                  <UploadCloud className="h-6 w-6" />
                </button>
                {member.image && member.image !== '/images/avatar-placeholder.png' && (
                  <button
                    onClick={handleDeleteImage}
                    className="mt-2 p-2 bg-white text-red-600 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    title="Supprimer l'image"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full"> {/* Allow text content to take full width and wrap */}
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={member.name || ''}
                onChange={handleChange}
                className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 uppercase tracking-wider text-center w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nom complet"
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 uppercase tracking-wider">
                {member.name || 'Nom non spécifié'}
              </h1>
            )}
            <div className="w-16 h-0.5 bg-blue-400 mx-auto mb-4"></div> {/* Centered line */}

            {isEditing ? (
              <input
                type="text"
                name="position"
                value={member.position || ''}
                onChange={handleChange}
                className="text-lg text-gray-700 mb-4 text-center w-full p-2 border border-gray-300 rounded-md"
                placeholder="Votre position / titre"
              />
            ) : (
              member.position && (
                <p className="text-lg text-gray-700 mb-4">{member.position}</p>
              )
            )}

            {isEditing ? (
              <input
                type="text"
                name="orcid"
                value={member.orcid || ''}
                onChange={handleChange}
                className="text-blue-600 text-sm md:text-base w-full p-2 border border-gray-300 rounded-md"
                placeholder="Lien ORCID"
              />
            ) : (
              member.orcid && (
                <div className="flex justify-center md:justify-start"> {/* Centered ORCID for small screens */}
                  <a
                    href={member.orcid.startsWith('http') ? member.orcid : `https://${member.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ORCID <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )
            )}
          </div>

          {canEdit && (
            <div className="absolute top-0 right-0 mt-2 mr-2 flex space-x-2"> {/* Added flex and space-x-2 for buttons */}
              {isEditing ? (
                <>
                  <button
                    onClick={() => { 
                      setIsEditing(false); 
                      setMember(originalMember); 
                      // Revert image states to original
                      setImagePreviewUrl(originalMember.image ? `${BACKEND_BASE_URL}${originalMember.image}` : '/images/avatar-placeholder.png');
                      setInitialSelectedFile(null);
                      setSrc(null);
                      setCrop(undefined);
                      setCompletedCrop(null);
                      setCroppedImageFile(null);
                      setIsCropModalOpen(false); // Ensure modal is closed on cancel edit
                    }}
                    // Updated className for clarity and size
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-md hover:bg-gray-300 transition-colors text-sm font-medium"
                    title="Annuler les modifications"
                  >
                    <CloseIcon className="h-5 w-5 mr-2" /> Annuler
                  </button>
                  {/* Password Change Button - Only visible when editing and for the logged-in user */}
                  {loggedInUser?.id === member.id && (
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      // Updated className for clarity and size
                      className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md shadow-md hover:bg-yellow-600 transition-colors text-sm font-medium"
                      title="Changer le mot de passe"
                    >
                      <Lock className="h-5 w-5 mr-2" /> Changer le mot de passe
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  // Updated className for clarity and size
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Modifier le profil"
                >
                  <Edit className="h-5 w-5 mr-2" /> Modifier le profil
                </button>
              )}
            </div>
          )}
        </div>

        {/* NEW: Cropping Modal */}
        {isCropModalOpen && src && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]"> {/* High z-index for modal overlay */}
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Recadrer l'image de profil</h2>
              <button
                onClick={handleCancelCrop} // Use cancel to close the modal
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                title="Fermer"
              >
                <CloseIcon className="h-6 w-6" />
              </button>

              <div className="flex flex-col items-center justify-center mb-4 max-h-[calc(90vh-180px)] overflow-hidden"> {/* Constrain height for cropping area */}
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  onComplete={handleCropComplete}
                  aspect={1} // Re-added: Force square aspect ratio for the cropping selection
                  circularCrop={true} // For rounded profile pictures (this will still make the *preview* circular, but the selection is rectangular)
                  minWidth={50}
                  minHeight={50}
                  className="w-full h-full" // Ensure ReactCrop takes available space
                >
                  {/* Image within ReactCrop - simplified classes for better rendering control by ReactCrop */}
                  <img ref={imgRef} alt="Source" src={src} onLoad={onImageLoad} className="block max-w-full max-h-full object-contain" />
                </ReactCrop>
              </div>

              <div className="flex justify-center space-x-4 mt-4 w-full">
                {completedCrop && (
                  <button
                    type="button"
                    onClick={handleApplyCrop}
                    className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" /> Appliquer le recadrage
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="inline-flex items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <CloseIcon className="h-5 w-5 mr-2" /> Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        {/* END NEW: Cropping Modal */}

        {/* NEW: Password Change Modal */}
        {showPasswordModal && loggedInUser?.id === member.id && ( // Only show if modal is open and it's the current user's profile
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
                <Lock className="h-7 w-7 mr-3 text-blue-600" /> Changer le mot de passe
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setShowOldPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmNewPassword(false);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Fermer"
              >
                <CloseIcon className="h-6 w-6" />
              </button>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                {/* Old Password */}
                <div>
                  <label htmlFor="oldPasswordModal" className="block text-sm font-medium text-gray-700">
                    Ancien mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      id="oldPasswordModal"
                      className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('old')}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none"
                        title={showOldPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPasswordModal" className="block text-sm font-medium text-gray-700">
                    Nouveau mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPasswordModal"
                      className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none"
                        title={showNewPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmNewPasswordModal" className="block text-sm font-medium text-gray-700">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      id="confirmNewPasswordModal"
                      className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:hover:text-blue-600 focus:outline-none"
                        title={showConfirmNewPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isPasswordChanging}
                >
                  {isPasswordChanging ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  {isPasswordChanging ? 'Mise à jour...' : 'Changer le mot de passe'}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* END NEW: Password Change Modal */}


        {/* Saving Button - Moved to bottom and fixed position */}
        {isEditing && hasChanges() && (
          <div className="fixed bottom-4 inset-x-0 mx-auto max-w-md p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-center z-40 shadow-lg"> {/* Changed to fixed bottom, higher z-index */}
            <button
              onClick={handleSaveChanges}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin h-5 w-5 mr-3" />
              ) : (
                <Save className="h-5 w-5 mr-3" />
              )}
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            {renderSection('Contact Info', Mail, (
              <div className="text-sm">
                {renderField('Email', member.email, 'email', Mail)}
                {/* Position field is now part of the main header, removed from here */}
                {renderField('Téléphone', member.phone, 'phone', Phone)}
              </div>
            ))}

            {renderSection('Biographie', InfoIcon, (
              <>
                {renderField('Biographie', member.biography, 'biography', InfoIcon, true)}
              </>
            ))}
          </div>

          <div>
            {renderArrayField('Expertises', 'expertises', newExpertise, setNewExpertise, BookOpen)}
            {renderArrayField('Centres d\'intérêt de recherche', 'researchInterests', newResearchInterest, setNewResearchInterest, BookOpen)}
            {renderArrayField('Formation Universitaire', 'universityEducation', newUniversityEducation, setNewUniversityEducation, GraduationCap)}
          </div>
        </div>

        {/* Publications Section REMOVED as requested */}

      </div>
    </div>
  );
};

export default MemberProfileEdit;
