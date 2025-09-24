// frontend/components/Auth/ResetPasswordPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import AnimatedMedicalBackground from '@/components/ui/AnimatedMedicalBackground';
import { resetPasswordWithToken } from '@/services/authApi'; // Import the new API function
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // To log in automatically after reset

const inter = Inter({ subsets: ['latin'] });

interface ResetPasswordPageProps {
  token: string;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth(); // To log the user in automatically

  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    // Basic password strength check (you can enhance this)
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await resetPasswordWithToken(token, newPassword);
      if (response.success && response.token && response.user) {
        setSuccessMessage('Votre mot de passe a été réinitialisé avec succès ! Redirection...');
        login(response.token, response.user); // Log user in
        setTimeout(() => {
          router.replace('/dashboard'); // Redirect to dashboard after successful reset and login
        }, 2000);
      } else {
        setError(response.message || 'Échec de la réinitialisation du mot de passe. Le lien est peut-être invalide ou expiré.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden ${inter.className}`}>
      {/* Animated Background */}
      <AnimatedMedicalBackground />

      {/* Reset Password Content - Positioned relatively, z-index 20 to be on top */}
      <div className="relative z-20 flex flex-col items-center w-full">
        <div className="mb-8">
          <Image
            src="/images/logo.png"
            alt="LABTIM Logo"
            width={180}
            height={180}
            className="w-48 h-48 object-contain rounded-md"
            unoptimized={true}
          />
        </div>

        {/* Reset Password Card (similar to login page) */}
        <div className="bg-gray-50 p-8 rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-md sm:p-10">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Définir un nouveau mot de passe</h2>
          <p className="text-center text-gray-600 mb-6">
            Veuillez entrer et confirmer votre nouveau mot de passe.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4 relative">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Nouveau mot de passe
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                className="absolute top-1/2 transform  right-3 flex items-center"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            <div className="mb-6 relative">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute top-1/2 transform right-3 flex items-center"
                aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white p-3 rounded-md font-semibold hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
