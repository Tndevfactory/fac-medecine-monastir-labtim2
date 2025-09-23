// components/Presentation.tsx (or app/presentation/page.tsx)
'use client';

import React from 'react';
import Image from 'next/image';
import { Inter, Playfair_Display } from 'next/font/google';

import AnimatedCounter from '@/components/ui/AnimatedCounter'; // Ensure this path is correct and the component is updated

// Initialize fonts
const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });

const Presentation: React.FC = () => {
  return (
    <section className={`bg-neutral-light-gray text-neutral-dark-gray p-6 sm:py-12 sm:px-8 flex flex-col items-center min-h-screen pt-24 ${inter.className}`}>
      {/* First Section */}
      <div className="max-w-6xl text-center">
        <h1 className={`text-4xl md:text-5xl font-extrabold text-primary-blue-dark mb-6 ${playfair.className}`}>
          Présentation
        </h1>
        
        {/* Avatar Placeholder */}
        <div className="mb-4">
          <Image
            src="/images/avatar-placeholder.png" // MAKE SURE THIS IMAGE EXISTS IN PUBLIC/IMAGES
            alt="Mohamed Hédi Bedoui Avatar"
            width={120}
            height={120}
            className="rounded-full mx-auto object-cover shadow-md"
            unoptimized={true}
          />
        </div>
        
        <p className={`text-lg text-neutral-dark-gray mb-4 ${inter.className}`}>
          Mohamed Hédi <b className="font-semibold">Bedoui</b>{' '}
          <span className="block text-base text-accent-blue-medium font-medium mt-1">
            Directeur du Laboratoire LTIM-LR12ES06
          </span>
        </p>
        
        {/* Paragraphs - text-left for consistent spacing */}
        <div className={`text-xl leading-relaxed text-neutral-dark-gray space-y-6 text-left`}>
          <p>
            La demande de création de ce laboratoire de recherche était en respect du décret n°2009-
            644 du 2 mars 2009, et pour répondre à l'objectif de fédération du potentiel humain et de
            moyens de trois unités de recherche de la Faculté de Médecine de Monastir : TIM «
            Technologie et Imagerie Médicale » 99UR08-27, créée depuis 1999, NVAP «
            Neurophysiologie de la Vigilance, de l’Attention et des Performances » 99UR08-23, créée
            depuis 1999 et A2SB « Algorithme et Architecture des Systèmes Biomédicaux ».
          </p>
          <p>
            Nous avons une approche de recherche multidisciplinaire et de développement
            Technologique. Le domaine choisi est le domaine médical avec comme rayon d'évolution les
            Technologies et Imagerie Médicale. Le laboratoire LTIM – LR12ES06 est formé de 78
            permanents dont 48 médecins, 18 informaticiens, 10 électroniciens et deux mathématiciens.
          </p>
          <p>
            Productions Scientifiques : de 2012 à 2022 nous avons produit 307 Articles impactés SJR et
            Thomson. En 2021 nous avons produit 1 article impacté par semaine en 2022 1.3 articles
            par semaine. En 2024 nous avons publié 73 articles et 6 ouvrages.
          </p>
        </div>
      </div>

      {/* Counters Section with neutral background, solid dark blue text, and superscript '+' */}
      <div className="bg-neutral-light-gray text-neutral-dark-gray w-full py-12 mt-12 mb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center px-4">
          {/* Counter 1: Permanents */}
          <div className="flex flex-col items-center">
            <AnimatedCounter
              endValue={75 } // Corrected value based on image_d5bffe.png
              suffix="+"
              duration={3000}
              numberClassName={`text-primary-blue-dark ${playfair.className}`} // Solid dark blue
            />
            <p className={`text-lg mt-2 text-neutral-dark-gray ${inter.className}`}>Permanents</p>
          </div>

          {/* Counter 2: Articles Impactés */}
          <div className="flex flex-col items-center">
            <AnimatedCounter
              endValue={300 } // Corrected value based on image_d5bffe.png
              suffix="+"
              duration={3000}
              numberClassName={`text-primary-blue-dark ${playfair.className}`} // Solid dark blue
            />
            <p className={`text-lg mt-2 text-neutral-dark-gray ${inter.className}`}>Articles impactés</p>
          </div>

          {/* Counter 3: Articles publiés en 2024 */}
          <div className="flex flex-col items-center">
            <AnimatedCounter
              endValue={70 } // Corrected value based on image_d5bffe.png
              suffix="+"
              duration={3000}
              numberClassName={`text-primary-blue-dark ${playfair.className}`} // Solid dark blue
            />
            <p className={`text-lg mt-2 text-neutral-dark-gray ${inter.className}`}>Articles publiés en 2024</p>
          </div>
        </div>
      </div>
      {/* End Counters Section */}

      {/* Second Section - Main Themes */}
      <div className="max-w-6xl text-center mt-12 sm:mt-16"> {/* INCREASED TOP MARGIN HERE */}
        {/* <h2 className={`text-2xl md:text-3xl font-bold text-primary-blue-dark mb-8 ${inter.className}`}>
          Les principaux thèmes de nos équipes de recherche :
        </h2> */}
        
        {/* List items - Added text-lg to descriptions for slightly less visual weight, increased space-y */}
        <div className={`text-xl leading-relaxed text-neutral-dark-gray space-y-6 text-left`}> {/* space-y-6 for more space between list items */}
          <ol className="list-decimal list-inside space-y-6 px-4 text-left">
            <li>
              <span className="text-accent-blue-medium">Plateforme de Médecine Avancée : </span>
              <span className="text-lg">Une plateforme sécurisée et éthiquement responsable permettant la collecte de données, le développement de solutions IA, et leur intégration dans la pratique clinique.</span>
            </li>
            <li>
              <span className="text-accent-blue-medium">Diagnostic des Maladies Neurologiques : </span>
              <span className="text-lg">Utilisation de l’apprentissage profond pour diagnostiquer les maladies neurologiques et prédire l’évolution des handicaps cognitifs et moteurs.</span>
            </li>
            <li>
              <span className="text-accent-blue-medium">Innovation pour les Patients Épileptiques : </span>
              <span className="text-lg">Mise en place de technologies avancées pour améliorer la prise en charge des patients épileptiques.</span>
            </li>
            <li>
              <span className="text-accent-blue-medium">Cardio AI : </span>
              <span className="text-lg">Développement d’une IA au service du diagnostic et du suivi des pathologies cardiaques.</span>
            </li>
            <li>
              <span className="text-accent-blue-medium">IA et Cancer du Sein : </span>
              <span className="text-lg">Utilisation de l’IA pour améliorer la prévention et la prise en charge du cancer du sein, de la détection à la gestion thérapeutique.</span>
            </li>
            <li>
              <span className="text-accent-blue-medium">Modélisation du mouvement humain : </span>
              <span className="text-lg">Analyse et quantification des gestes pour la détection et le suivi des pathologies musculosquelettiques.</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="mt-12 w-full max-w-4xl">
        <Image
          src="/images/evolution.png"
          alt="Évolution du laboratoire"
          width={1000}
          height={600}
          layout="responsive"
          className="rounded-xl shadow-lg w-full h-auto"
          unoptimized={true}
        />
      </div>
    </section>
  );
};

export default Presentation;