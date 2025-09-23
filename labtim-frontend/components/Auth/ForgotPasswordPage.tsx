// frontend/components/Auth/ForgotPasswordPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import AnimatedMedicalBackground from '@/components/ui/AnimatedMedicalBackground';
import { requestPasswordReset } from '@/services/authApi'; // Import the new API function

const inter = Inter({ subsets: ['latin'] });

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.');
      setIsLoading(false);
      return;
    }

    try {
      // Call the new API function
      const response = await requestPasswordReset(email);
      if (response.success) {
        setSuccessMessage('Si un compte avec cet email existe, un lien de réinitialisation a été envoyé à votre adresse e-mail.');
      } else {
        // Backend should ideally send generic message even on failure for security
        setError(response.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden ${inter.className}`}>
      {/* Animated Background */}
      <AnimatedMedicalBackground />

      {/* Forgot Password Content - Positioned relatively, z-index 20 to be on top */}
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

        {/* Forgot Password Card (similar to login page) */}
        <div className="bg-gray-50 p-8 rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-md sm:p-10">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Mot de passe oublié ?</h2>
          <p className="text-center text-gray-600 mb-6">
            Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                autoComplete="email"
              />
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
                'Envoyer le lien de réinitialisation'
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            <Link href="/connexion" className="text-blue-600 hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
