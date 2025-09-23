// frontend/components/Auth/signupPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Changed to next/navigation for App Router
import { checkUsersExist, initialAdminSignup } from '@/services/authApi';
import { useAuth } from '@/context/AuthContext';
import { Loader2, User, Mail, Lock, Info } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const SignupPage: React.FC = () => { // Renamed from InitialSignupPage to SignupPage
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const verifyUserExistence = async () => {
      try {
        const { exists } = await checkUsersExist(); // FIX: Changed 'usersExist' to 'exists'
        if (exists) {
          // If users already exist, redirect to login page
          router.replace('/login');
        } else {
          setIsLoading(false); // No users, show signup form
        }
      } catch (error: any) {
        console.error('Error verifying user existence:', error);
        setErrorModal({
          title: 'Erreur de Connexion',
          message: `Impossible de vérifier l'existence des utilisateurs. Veuillez réessayer plus tard. Détails: ${error.message}`
        });
        setIsLoading(false); // Stop loading, but show error
      }
    };

    verifyUserExistence();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setToast({ message: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);

    try {
      const response = await initialAdminSignup({ name, email, password });
      if (response.success) {
        setToast({ message: response.message || 'Admin créé avec succès !', type: 'success' });
        if (response.token && response.user) {
          login(response.token, response.user);
          router.push('/dashboard');
        } else {
          throw new Error('Token ou utilisateur manquant dans la réponse.');
        }
      } else {
        throw new Error(response.message || 'Échec de la création de l\'administrateur initial.');
      }
    } catch (error: any) {
      console.error('Initial admin signup failed:', error);
      setErrorModal({
        title: 'Erreur d\'Inscription',
        message: `La création du compte a échoué. Détails: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-100 ${inter.className}`}>
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <p className="ml-3 text-lg text-gray-700">Vérification de l'état initial...</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-4 bg-gray-100 ${inter.className}`}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg mx-auto border border-gray-200">
        <div className="flex items-center space-x-4 mb-6">
          <Info className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">Configuration Initiale</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Bienvenue ! Il s'agit de la première exécution. Veuillez créer un compte administrateur initial.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center mb-1">
                <User className="h-4 w-4 mr-2" /> Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center mb-1">
                <Mail className="h-4 w-4 mr-2" /> Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="nom.prenom@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center mb-1">
                <Lock className="h-4 w-4 mr-2" /> Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="********"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 flex items-center mb-1">
                <Lock className="h-4 w-4 mr-2" /> Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="********"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Info className="h-5 w-5 mr-2" /> // Using Info icon for setup
            )}
            {isSubmitting ? 'Inscription...' : 'Créer le compte Admin'}
          </button>
        </form>
      </div>

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
          briefDescription={errorModal.message}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  );
};

export default SignupPage;