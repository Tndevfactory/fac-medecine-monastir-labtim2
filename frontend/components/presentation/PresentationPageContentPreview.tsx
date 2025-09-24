
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Inter, Playfair_Display } from 'next/font/google';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { ContentBlock, TextContentBlock, ImageContentBlock } from '@/types/index';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] });
const MAX_IMAGE_DISPLAY_WIDTH = 700;

interface PresentationPageContentPreviewProps {
  contentBlocks: ContentBlock[];
  directorName: string | null;
  directorPosition: string | null;
  directorImage: string | null;
  counter1Value: number | null;
  counter1Label: string | null;
  counter2Value: number | null;
  counter2Label: string | null;
  counter3Value: number | null;
  counter3Label: string | null;
}

const PresentationPageContentPreview: React.FC<PresentationPageContentPreviewProps> = ({
  contentBlocks,
  directorName,
  directorPosition,
  directorImage,
  counter1Value,
  counter1Label,
  counter2Value,
  counter2Label,
  counter3Value,
  counter3Label,
}) => {
  return (
    <section className={`bg-neutral-light-gray text-neutral-dark-gray p-6 sm:py-12 sm:px-8 flex flex-col items-center w-full ${inter.className}`}>
      <div className="max-w-6xl text-center w-full">
        <h1 className={`text-4xl md:text-5xl font-extrabold text-primary-blue-dark mb-6 ${playfair.className}`}>Présentation</h1>
        {(directorName || directorPosition || directorImage) && (
          <div className="mb-4">
            {directorImage && (
              <Image
                src={directorImage}
                alt={directorName || "Directeur Image"}
                width={120}
                height={120}
                className="rounded-full mx-auto object-cover shadow-md mb-2"
                unoptimized={true}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://placehold.co/120x120/cccccc/333333?text=Image+introuvable';
                }}
              />
            )}
            {directorName && (
              <p className={`text-lg text-neutral-dark-gray ${inter.className}`}>{directorName}{' '}</p>
            )}
            {directorPosition && (
              <span className="block text-base text-accent-blue-medium font-medium mt-1">{directorPosition}</span>
            )}
          </div>
        )}
        {contentBlocks.length > 0 ? (
          <ContentBlocksRenderer contentBlocks={contentBlocks} />
        ) : (
          <div className="text-center text-gray-500 py-6 w-full">
            <p>Aucun contenu personnalisé disponible.</p>
          </div>
        )}
      </div>
      {(counter1Value !== null || counter2Value !== null || counter3Value !== null) && (
        <div className="bg-neutral-light-gray text-neutral-dark-gray w-full py-12 mt-12 mb-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center px-4">
            {(counter1Value !== null && counter1Label) && (
              <div className="flex flex-col items-center">
                <AnimatedCounter
                  endValue={counter1Value}
                  suffix="+"
                  duration={3000}
                  numberClassName={`text-primary-blue-dark ${playfair.className}`}
                />
                <p className={`text-lg mt-2 text-neutral-dark-gray ${inter.className}`}>{counter1Label}</p>
              </div>
            )}
            {(counter2Value !== null && counter2Label) && (
              <div className="flex flex-col items-center">
                <AnimatedCounter
                  endValue={counter2Value}
                  suffix="+"
                  duration={3000}
                  numberClassName={`text-primary-blue-dark ${playfair.className}`}
                />
                <p className={`text-lg mt-2 text-neutral-dark-gray ${inter.className}`}>{counter2Label}</p>
              </div>
            )}
            {(counter3Value !== null && counter3Label) && (
              <div className="flex flex-col items-center">
                <AnimatedCounter
                  endValue={counter3Value}
                  suffix="+"
                  duration={3000}
                  numberClassName={`text-primary-blue-dark ${playfair.className}`}
                />
                <p className={`text-lg mt-2 text-neutral-dark-gray ${inter.className}`}>{counter3Label}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PresentationPageContentPreview;

// --- Helper component for SSR-safe DOMPurify rendering ---
function ContentBlocksRenderer({ contentBlocks }: { contentBlocks: ContentBlock[] }) {
  const [domPurify, setDomPurify] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import('dompurify').then((mod) => {
      if (mounted) setDomPurify(() => mod.default);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className={`text-xl leading-relaxed text-neutral-dark-gray space-y-6 text-left w-full mx-auto max-w-7xl`}>
      {contentBlocks.map((block, index) => {
        if (block.type === 'text') {
          const textBlock = block as TextContentBlock;
          const cleanHtml = domPurify && domPurify.sanitize
            ? domPurify.sanitize(textBlock.value, { USE_PROFILES: { html: true } })
            : textBlock.value;
          return (
            <div key={block.id || index} className="text-gray-800 leading-relaxed text-lg text-left">
              <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </div>
          );
        } else if (block.type === 'image') {
          const imageBlock = block as ImageContentBlock;
          const imageUrlForDisplay = imageBlock.url;
          const effectiveWidth = imageBlock.width || imageBlock.originalWidth || MAX_IMAGE_DISPLAY_WIDTH;
          const effectiveHeight = imageBlock.height || imageBlock.originalHeight || Math.round(effectiveWidth * (9/16));
          return (
            <figure key={block.id || index} className="my-0 p-0 w-full flex flex-col items-center">
              {imageUrlForDisplay && (
                <div
                  className="relative mx-auto overflow-hidden rounded-lg shadow-md bg-gray-100 flex items-center justify-center p-0 m-0"
                  style={{
                    width: effectiveWidth ? `${effectiveWidth}px` : '100%',
                    height: effectiveHeight ? `${effectiveHeight}px` : 'auto',
                    maxWidth: '100%',
                    maxHeight: '400px',
                  }}
                >
                  <Image
                    src={imageUrlForDisplay}
                    alt={imageBlock.altText || 'Image de la section'}
                    width={effectiveWidth}
                    height={effectiveHeight}
                    className="object-contain w-full h-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                    priority={index < 2}
                    unoptimized={imageUrlForDisplay.startsWith('blob:')}
                    onError={(e: any) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = 'https://placehold.co/800x450/cccccc/333333?text=Image+introuvable';
                    }}
                  />
                </div>
              )}
              {imageBlock.caption && (
                <figcaption className="mt-2 text-center text-sm text-gray-600">
                  {imageBlock.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
