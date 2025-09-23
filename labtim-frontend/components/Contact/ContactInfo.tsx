// components/Contact/ContactInfo.tsx
'use client';

import React, { useState } from 'react'; // Import useState
import { Inter } from 'next/font/google';
import { MapPin, Phone, Mail, Send } from 'lucide-react'; // Import Send icon

const inter = Inter({ subsets: ['latin'] });

const ContactInfo = () => {
  const address = 'Laboratoire de Biophysique, Faculté de Médecine de Monastir, 3eme Etage, Avenue Avicenne, 5019 Monastir Tunisie';
  const phone1 = '+216 73 462 200';
  const phone2 = '+216 73 460 737';
  const email = 'medhedi.bedoui@fmm.rnu.tn';

  // **IMPORTANT: REPLACE THIS URL** with the one you get from Google Maps "Embed a map" feature.
  // Go to Google Maps -> Search for "Faculté de Médecine de Monastir" -> Click "Share" -> "Embed a map" -> Copy the 'src' value.
  const googleMapsEmbedUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d340.2822711466146!2d10.833523061371281!3d35.76729922599138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x130212ce0db433ab%3A0xb9a0b94ad165d4e8!2sFacult%C3%A9%20de%20m%C3%A9decine%20de%20Monastir!5e0!3m2!1sfr!2stn!4v1749552964040!5m2!1sfr!2stn';

  // State for form fields
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    sujet: '',
    contenu: ''
  });

  // New state to control the sending animation
  const [isSending, setIsSending] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // State for feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Votre message a été envoyé avec succès.' });
        setFormData({ nom: '', prenom: '', email: '', sujet: '', contenu: '' });
      } else {
        setFeedback({ type: 'error', message: data.message || "Erreur lors de l'envoi du message." });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || "Erreur lors de l'envoi du message." });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <section className={`py-16 bg-white ${inter.className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Contact</h2>

        {/* Contact Form Section - NEW */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-lg shadow-xl mb-12 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Envoyez-nous un message</h3>
          {/* Feedback message */}
          {feedback && (
            <div className={`mb-4 text-center rounded-md py-2 px-4 font-medium ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {feedback.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nom" className="block text-white text-sm font-medium mb-2">Nom</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-300 focus:border-blue-300 text-gray-900 placeholder-gray-500"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-white text-sm font-medium mb-2">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-300 focus:border-blue-300 text-gray-900 placeholder-gray-500"
                  placeholder="Votre prénom"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-300 focus:border-blue-300 text-gray-900 placeholder-gray-500"
                placeholder="votre.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="sujet" className="block text-white text-sm font-medium mb-2">Sujet</label>
              <input
                type="text"
                id="sujet"
                name="sujet"
                value={formData.sujet}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-300 focus:border-blue-300 text-gray-900 placeholder-gray-500"
                placeholder="Sujet de votre message"
              />
            </div>
            <div>
              <label htmlFor="contenu" className="block text-white text-sm font-medium mb-2">Contenu</label>
              <textarea
                id="contenu"
                name="contenu"
                rows={5}
                value={formData.contenu}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-300 focus:border-blue-300 text-gray-900 placeholder-gray-500 resize-y"
                placeholder="Écrivez votre message ici..."
              ></textarea>
            </div>
            <div className="text-center">
                <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                disabled={isSending}
                >
                {isSending ? 'Envoi...' : 'Envoyer le message'}
                <Send
                  className={`ml-2 h-5 w-5 transition-all duration-700 ease-out
                  ${isSending ? 'opacity-0 translate-x-8' : 'opacity-100'}
                  `}
                />
                </button>
            </div>
          </form>
        </div>


        {/* The gap for spacing between the info and map sections is good */}
        <div className="flex flex-col lg:flex-row items-start lg:justify-between gap-8">
          {/* Contact Information Section */}
          {/* p-4 provides internal padding */}
          <div className="w-full lg:w-1/3 p-4"> 
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Informations de contact</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="flex-shrink-0 w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <p className="text-gray-700 font-medium">Adresse :</p>
                  <p className="text-gray-600">{address}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="flex-shrink-0 w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-gray-700 font-medium">Téléphone :</p>
                  <p className="text-gray-600">
                    <a href={`tel:${phone1}`} className="hover:underline">{phone1}</a>
                  </p>
                  <p className="text-gray-600">
                    <a href={`tel:${phone2}`} className="hover:underline">{phone2}</a>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="flex-shrink-0 w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-gray-700 font-medium">Email :</p>
                  <p className="text-gray-600">
                    <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                      {email}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Map Section */}
          {/* p-4 provides internal padding */}
          <div className="w-full lg:w-2/3 p-4">
            <div className="aspect-w-16 aspect-h-9 w-full">
              <iframe
                src={googleMapsEmbedUrl}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Laboratoire de Biophysique, Faculté de Médecine de Monastir"
                className="rounded-md"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactInfo;
