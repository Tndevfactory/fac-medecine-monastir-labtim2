// frontend/components/HeroSection/HeroSectionPreview.tsx
import React from 'react';
import Image from 'next/image';
import { Hero } from '@/types/index';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface HeroSectionPreviewProps {
  hero: Hero;
}

const HeroSectionPreview: React.FC<HeroSectionPreviewProps> = ({ hero }) => {
  return (
    <div className={`relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-lg shadow-xl ${inter.className}`}>
      {hero.imageUrl ? (
        <Image
          src={hero.imageUrl}
          alt={hero.title || 'Hero Background'}
          layout="fill"
          objectFit="cover"
          className="z-0"
          unoptimized={true} // Use unoptimized for local/dynamic images
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/1200x500/cccccc/333333?text=Image+Not+Found'; // Fallback
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center">
          <span className="text-white text-lg font-semibold">No Image Selected</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-center p-4 z-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
          {hero.title || 'Hero Title Preview'}
        </h2>
        <p className="text-base md:text-lg text-gray-200 mb-6 max-w-2xl drop-shadow-md">
          {hero.description || 'This is a placeholder for your hero section description. You can update it using the form below.'}
        </p>
        {hero.buttonContent && (
          <button className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300">
            {hero.buttonContent}
          </button>
        )}
      </div>
    </div>
  );
};

export default HeroSectionPreview;
