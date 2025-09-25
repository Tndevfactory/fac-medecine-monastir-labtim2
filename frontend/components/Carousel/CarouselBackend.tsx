// components/Carousel/Carousel.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import icons for navigation buttons
import { CarouselItem } from "@/types/index"; // Import the CarouselItem type

const inter = Inter({
  subsets: ["latin"], // Specify subsets (e.g., 'latin', 'cyrillic')
  variable: "--font-inter", // Optional: CSS variable name
});

// Define props interface for Carousel
interface CarouselProps {
  slides: CarouselItem[]; // Now accepts an array of CarouselItem
}

const Carousel: React.FC<CarouselProps> = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length;
  const autoPlayInterval = 5000; // 5 seconds

  // Reset slide to 0 if slides change (e.g., in preview mode)
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides]);

  useEffect(() => {
    if (totalSlides === 0) return; // Don't start timer if no slides

    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
    }, autoPlayInterval);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [totalSlides, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + totalSlides) % totalSlides); // Ensures correct wrap-around for previous
  };

  if (totalSlides === 0) {
    return (
      <div
        className={`relative w-full h-[33vh] flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg shadow-xl ${inter.variable}`}
      >
        <p>Aucun élément de carrousel à afficher.</p>
      </div>
    );
  }

  return (
    <section
      className={`relative w-full overflow-hidden my-8 rounded-lg shadow-xl ${inter.variable}`}
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          // Use link from slide if available, otherwise just a div
          <div
            key={slide.id}
            className="w-full flex-shrink-0 relative h-[33vh]"
          >
            {/* Image */}
            <Image
              src={slide.imageUrl}
              alt={slide.title || "Carousel image"}
              fill // Makes the image fill the parent div
              style={{ objectFit: "cover" }} // Ensures the image covers the area
              quality={80} // Adjust quality for performance
              priority={slide.order === 1} // Prioritize loading for the first slide (assuming order 1 is first)
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="absolute inset-0 z-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://placehold.co/1260x750/cccccc/333333?text=Image+introuvable"; // Fallback
                console.error("Error loading image:", slide.imageUrl);
              }}
            />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>

            {/* Text Content */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
              {/* Adjusted text sizes to fit smaller dimensions */}
              {slide.title && (
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-2 drop-shadow-lg">
                  {slide.title}
                </h2>
              )}
              {slide.description && (
                <p className="text-base sm:text-lg md:text-xl max-w-xl drop-shadow-md">
                  {slide.description}
                </p>
              )}
              {slide.link && (
                <a
                  href={slide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  En savoir plus
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 p-2 rounded-full text-white hover:bg-opacity-50 transition-all duration-300 z-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 p-2 rounded-full text-white hover:bg-opacity-50 transition-all duration-300 z-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2.5 w-2.5 rounded-full bg-white transition-all duration-300 ${
              currentSlide === index
                ? "w-6 bg-blue-500"
                : "bg-opacity-50 hover:bg-opacity-75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default Carousel;
