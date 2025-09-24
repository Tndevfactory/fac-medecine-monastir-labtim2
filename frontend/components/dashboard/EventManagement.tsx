// components/dashboard/EventManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft, MapPin, UploadCloud, XCircle
} from 'lucide-react';
import { Inter } from 'next/font/google';
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';
import { getAllEvents, createEvent as apiCreateEvent, updateEvent as apiUpdateEvent, deleteEvent } from '@/services/eventsApi';
import { Event } from '@/types/index';

const inter = Inter({ subsets: ['latin'] });

const EventManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);

  // Form state
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  // Removed organizer field
  const [url, setUrl] = useState('');
  // Removed image fields

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title?: string; briefDescription: string; detailedError?: string } | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAllEvents(token);
      setEvents(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des événements.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        router.push('/connexion');
        return;
      }
      fetchEvents();
    }
  }, [authLoading, isAuthenticated, userRole, router, fetchEvents]);

  // Form helpers
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
  setUrl('');
    setEditingEvent(null);
  };

  // Removed handleFileChange for image

  // Create or update event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setErrorModal(null);
    if (!title.trim() || !description.trim() || !date.trim()) {
      setErrorModal({ briefDescription: "Veuillez remplir tous les champs obligatoires (titre, description, date)." });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
  formData.append('location', location);
  if (url) formData.append('url', url);
      if (currentView === 'add') {
        await apiCreateEvent(formData, token!);
        setToast({ message: 'Événement créé avec succès !', type: 'success' });
      } else if (currentView === 'edit' && editingEvent) {
        await apiUpdateEvent(editingEvent.id, formData, token!);
        setToast({ message: 'Événement mis à jour avec succès !', type: 'success' });
      }
      fetchEvents();
      setCurrentView('list');
      resetForm();
    } catch (err: any) {
      setErrorModal({ briefDescription: err.message || 'Erreur lors de la soumission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit event
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setLocation(event.location);
  // Removed organizer field
    setUrl(event.url || '');
  // Removed image fields
    setCurrentView('edit');
  };

  // Delete event
  const handleDelete = async () => {
    if (!confirmDeleteEventId || !token) return;
    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);
    try {
      await deleteEvent(confirmDeleteEventId, token);
      setToast({ message: 'Événement supprimé avec succès !', type: 'success' });
      fetchEvents();
      setConfirmDeleteEventId(null);
    } catch (err: any) {
      setErrorModal({ briefDescription: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI
  if (authLoading || loading) {
    return (
      <div className={`flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 ${inter.className}`}>
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <p className="ml-4 text-lg text-gray-700">Chargement des événements...</p>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <div className={`flex min-h-[calc(100vh-80px)] items-center justify-center bg-red-100 text-red-700 p-8 ${inter.className}`}>
        <p className="text-lg">Accès non autorisé. Seuls les administrateurs peuvent gérer les événements.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className="mb-10 text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <CalendarIcon className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Gestion des Événements</h1>
          <p className="text-lg text-white">Gérez les événements du laboratoire.</p>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {/* Error Modal */}
      {errorModal && (
        <ErrorModal briefDescription={errorModal.briefDescription} detailedError={errorModal.detailedError} onClose={() => setErrorModal(null)} />
      )}

      {currentView === 'list' && (
        <>
          <div className="w-full bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <PlusCircle className="w-6 h-6 mr-3 text-blue-600" /> Ajouter un nouvel événement
            </h2>
            <button
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
              onClick={() => { resetForm(); setCurrentView('add'); }}
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Créer un événement
            </button>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map(event => (
                    <tr key={event.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{event.title}</td>
                      <td className="px-4 py-2 text-gray-700">{event.date}</td>
                      <td className="px-4 py-2 text-gray-700">{event.location}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEdit(event)}>
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" onClick={() => setConfirmDeleteEventId(event.id)}>
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500 py-6">Aucun événement trouvé.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {(currentView === 'add' || (currentView === 'edit' && editingEvent)) && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative max-w-xl mx-auto">
          <button
            onClick={() => { setCurrentView('list'); resetForm(); }}
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retourner
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 mt-12">{currentView === 'add' ? 'Créer un événement' : 'Modifier l\'événement'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input type="text" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
              <input type="text" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={location} onChange={e => setLocation(e.target.value)} required />
            </div>
            {/* Removed organizer field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lien (optionnel)</label>
              <input type="url" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            {/* Removed image upload field */}
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <PlusCircle className="h-5 w-5 mr-2" />}
              {isSubmitting ? 'Enregistrement...' : (currentView === 'add' ? 'Créer' : 'Mettre à jour')}
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteEventId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mt-2">Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.</p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button onClick={() => setConfirmDeleteEventId(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>Annuler</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
