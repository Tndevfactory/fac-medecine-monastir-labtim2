// components/Auth/LoginPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginUser, checkUsersExist } from '@/services/authApi';
import { LoginRequest, LoginResponse, User } from '@/types/index'; // Corrected import
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// import AnimatedMedicalBackground from '@/components/ui/AnimatedMedicalBackground';

const inter = Inter({ subsets: ['latin'] });

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  const router = useRouter();
  const { login, isAuthenticated, mustChangePassword } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      router.replace('/dashboard');
      return;
    }

    const verifyInitialSetup = async () => {
      try {
        const response = await checkUsersExist();
        if (!response.exists) {
          router.replace('/sign-up');
        } else {
          setIsLoadingCheck(false);
        }
      } catch (error: any) {
        console.error('Error checking initial setup:', error);
        setError('Impossible de vérifier l\'état initial de l\'application. Veuillez réessayer.');
        setIsLoadingCheck(false);
      }
    };

    if (!isAuthenticated && isLoadingCheck) {
      verifyInitialSetup();
    } else if (isAuthenticated) {
      setIsLoadingCheck(false);
    }
  }, [isAuthenticated, router, mustChangePassword, isLoadingCheck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      setIsLoading(false);
      return;
    }

    const requestBody: LoginRequest = { email, password };

    try {
      const response: LoginResponse = await loginUser(requestBody);

      if (response.success && response.token && response.user) {
        login(response.token, response.user);
        setSuccessMessage('Connexion réussie ! Redirection...');
        console.log('Login successful:', response.message);
      } else {
        setError(response.message || 'Échec de la connexion. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCheck) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-100 ${inter.className}`}>
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <p className="ml-3 text-lg text-gray-700">Vérification de l'état initial...</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden ${inter.className}`}>
      {/* Animated Background */}
      {/* <AnimatedMedicalBackground /> */}

      {/* Login Content - Positioned relatively, z-index 20 to be on top */}
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

        {/* Login Card with enhanced shadow and border, and subtle background */}
        <div className="bg-gray-50 p-8 rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-md sm:p-10">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Connexion</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Identifiant ou adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            <div className="mb-6 relative">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute top-1/2 transform right-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center mb-6">
              <Link href="/mot-de-passe-oublie" className="text-sm text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
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
              {isLoading ? 'Connexion en cours...' : 'Connexion'}
            </button>
          </form>

          {/* <p className="text-center text-gray-600 text-sm mt-6">
            Vous n'avez pas de compte ?{' '}
            <Link href="/inscription" className="text-blue-600 hover:underline">
              Inscrivez-vous
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;