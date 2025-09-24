// components/events/EventsSection.tsx
'use client';

import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });


import { useEffect, useState, useRef } from 'react';
import { getAllEvents } from '@/services/eventsApi';
import { Event } from '@/types/index';

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllEvents();
        setEvents(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des événements.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Swiping logic: show 3 events at a time, swipe to see more
  const [startIdx, setStartIdx] = useState(0);
  const maxVisible = 3;
  const canSwipeLeft = startIdx > 0;
  const canSwipeRight = startIdx + maxVisible < events.length;

  const handleSwipeLeft = () => {
    if (canSwipeLeft) setStartIdx(startIdx - 1);
  };
  const handleSwipeRight = () => {
    if (canSwipeRight) setStartIdx(startIdx + 1);
  };

  return (
    <section className={`py-16 bg-white min-h-[40vh] flex flex-col justify-center ${inter.className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Événements</h2>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="relative flex items-center justify-center">
            <button
              onClick={handleSwipeLeft}
              disabled={!canSwipeLeft}
              className={`absolute left-0 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white shadow-md text-blue-600 text-lg transition
                hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400
                disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ top: '50%', transform: 'translateY(-50%) translateX(-32px)' }}
              aria-label="Voir les événements précédents"
            >
              &#8592;
            </button>
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 px-8">
              {events.length === 0 && (
                <div className="text-gray-500">Aucun événement trouvé.</div>
              )}
              {events.slice(startIdx, startIdx + maxVisible).map((event) => {
                const dateObj = event.date ? new Date(event.date) : null;
                const day = dateObj ? dateObj.getDate().toString().padStart(2, '0') : '';
                const month = dateObj ? dateObj.toLocaleString('fr-FR', { month: 'long' }) : '';
                const year = dateObj ? dateObj.getFullYear() : '';
                return (
                  <div key={event.id} className="p-4">
                    <div className="flex items-start">
                      <div className="text-blue-600 font-bold text-3xl mr-4 leading-none text-center">
                        {day}
                        <span className="block text-xl uppercase mt-1 text-gray-600">{month}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-1">
                          {event.title}
                        </h3>
                        <div className="text-gray-500 text-xs">{year}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSwipeRight}
              disabled={!canSwipeRight}
              className={`absolute right-0 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white shadow-md text-blue-600 text-lg transition
                hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400
                disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ top: '50%', transform: 'translateY(-50%) translateX(32px)' }}
              aria-label="Voir les événements suivants"
            >
              &#8594;
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Events;