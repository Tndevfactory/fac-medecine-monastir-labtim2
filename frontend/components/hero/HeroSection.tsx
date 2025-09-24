'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component for optimized images
import { Inter } from 'next/font/google';
import { getHeroSection } from '@/services/heroApi'; // Import the API call
import { Hero } from '@/types/index'; // Import the Hero type
import { Loader2, Info } from 'lucide-react'; // For loading/error indicators

const inter = Inter({ subsets: ['latin'] });

const HeroSection: React.FC = () => {
  const [heroData, setHeroData] = useState<Hero | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getHeroSection();
        if (response.success && response.data) {
          setHeroData(response.data);
        } else {
          // If no hero data exists or response indicates failure, set a default/empty state
          setHeroData({
            title: 'Welcome to LABTIM',
            description: 'Discover our research, publications, and team members.',
            buttonContent: 'Learn More',
            imageUrl: null, // No image initially
          });
          console.warn(response.message || 'No Hero section found, displaying default content.');
        }
      } catch (err: any) {
        console.error('Failed to fetch hero section:', err);
        setError('Failed to load hero content. Please try again later.');
        // Still display default content on error
        setHeroData({
          title: 'Welcome to LABTIM',
          description: 'Discover our research, publications, and team members.',
          buttonContent: 'Learn More',
          imageUrl: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-[33vh] bg-gray-50 text-gray-700 ${inter.className}`}>
        <Loader2 className="h-8 w-8 animate-spin mr-3 text-blue-600" />
        Chargement de la section Hero...
      </div>
    );
  }

  // Fallback if heroData is still null (shouldn't happen with the default state)
  if (!heroData) {
    return (
      <div className={`flex justify-center items-center h-[33vh] bg-red-50 text-red-700 ${inter.className}`}>
        <Info className="h-8 w-8 mr-3" />
        {error || 'Impossible d\'afficher la section Hero.'}
      </div>
    );
  }

  // Use dynamic values from heroData
  const { title, description, buttonContent, imageUrl } = heroData;

  return (
    <>
      {/* Global styles from your original file */}
      <style jsx global>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }\
        }
        @keyframes slideInFromBottom {
          0% { opacity: 0; transform: translateY(50px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Main Hero Section */}
      {/* Adjusted height to roughly 1/3 of viewport height */}
      <section className={`relative w-full h-[33vh] flex items-center justify-center text-white overflow-hidden shadow-2xl rounded-b-3xl ${inter.className}`}>
        {/* Background Image */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title || 'Hero Background'}
            layout="fill"
            objectFit="cover"
            priority // Prioritize loading for LCP
            className="z-0 animate-[kenBurns_15s_ease-in-out_infinite_alternate]"
            unoptimized={true} // Use unoptimized for local/dynamic images if not using Next.js image optimization service
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/1920x1080/cccccc/333333?text=Image+Not+Found'; // Fallback image
            }}
          />
        ) : (
          // Default gradient background if no image
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-800 z-0"></div>
        )}


        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 z-10"></div>

        {/* Content */}
        <div className="relative z-20 text-center px-4 py-4 md:py-6 lg:py-8 max-w-5xl mx-auto"> {/* Adjusted padding for smaller height */}
          <h1 className="text-2xl md:text-4xl font-extrabold mb-2 animate-fadeInUp tracking-tight leading-tight drop-shadow-lg" style={{ animationDelay: '0.2s' }}>
            {title}
          </h1>
          <p className="text-sm md:text-base mb-4 animate-fadeInLeft max-w-3xl mx-auto leading-relaxed drop-shadow-md" style={{ animationDelay: '0.4s' }}>
            {description}
          </p>

          {buttonContent && (
            <div className="animate-slideInFromBottom" style={{ animationDelay: '0.6s' }}>
              <Link href="/membres" className="relative inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white transition-all duration-300 ease-in-out rounded-full shadow-lg overflow-hidden group
              bg-blue-600 hover:bg-blue-700"> {/* Adjusted padding and font size for smaller height */}
                <span className="relative z-10">{buttonContent}</span>
                {/* Background gradient - now for hover effect only */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                {/* Ripple effect */}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full group-hover:w-full group-hover:h-full group-hover:-translate-x-1/2 group-hover:-translate-y-1/2 transition-all duration-500 bg-white opacity-20"></span>
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Decorative elements - animated green accent */}
        <div
          className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-400 to-transparent opacity-20 rounded-full blur-3xl animate-pulse" /* Smaller for reduced height */
          style={{ animation: 'pulse 3s ease-in-out infinite' }}
        ></div>

        {/* Additional floating particles */}
        <div
          className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 opacity-30 rounded-full animate-bounce" /* Smaller for reduced height */
          style={{ animationDelay: '1s', animationDuration: '3s' }}
        ></div>
        <div
          className="absolute top-1/3 right-1/6 w-1 h-1 bg-green-400 opacity-40 rounded-full animate-bounce" /* Smaller for reduced height */
          style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/5 w-3 h-3 bg-purple-400 opacity-20 rounded-full animate-bounce" /* Smaller for reduced height */
          style={{ animationDelay: '2s', animationDuration: '3.5s' }}
        ></div>
      </section>
    </>
  );
};

export default HeroSection;
