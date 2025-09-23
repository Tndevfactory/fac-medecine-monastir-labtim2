// app/page.tsx
import HeroSection from "@/components/hero/HeroSection";
import Actus from "@/components/Actualites/Actus";
import Events from "@/components/events/Events";
import Presentation from "@/app/ltim/presentation/presentation";
import MembresList from "@/components/Membres/MembresList"; 
import { getAllCarouselItems } from '@/services/carouselApi'; // Import the API service
import { CarouselItem } from '@/types/index'; // Import the CarouselItem type
import Carousel from '@/components/Carousel/Carousel'; // Import the Carousel component

const HomePage: React.FC = async () => {
  let carouselSlides: CarouselItem[] = [];
  let carouselError: string | null = null;

  try {

    const response = await getAllCarouselItems(''); // or pass empty string '' if token is optional
    
    
    if (response.success && Array.isArray(response.data)) {
      carouselSlides = response.data;
    } else {
      carouselError = response.message || 'Failed to fetch carousel items.';
    }
  } catch (err: any) {
    console.error("Error fetching carousel items for homepage:", err);
    carouselError = `Erreur de chargement du carrousel : ${err.message || 'Veuillez réessayer plus tard.'}`;
  }

  return (
    <>
      <HeroSection />

      <Actus /> {/* */}
                   {/* Conditionally render Carousel or an error message */}
      {carouselError ? (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 my-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
            <strong className="font-bold">Erreur !</strong>
            <span className="block sm:inline"> {carouselError}</span>
            <p className="text-sm mt-1">Le carrousel n'a pas pu être chargé. Veuillez vérifier la connexion ou le backend.</p>
          </div>
        </div>
      ) : (
        <Carousel slides={carouselSlides} /> // Pass the fetched slides to the Carousel component
      )}
      <Events /> {/* */}
    </>
  );
}

export default HomePage;