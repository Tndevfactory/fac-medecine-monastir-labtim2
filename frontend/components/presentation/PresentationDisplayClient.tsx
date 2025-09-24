// frontend/components/presentation/PresentationDisplayClient.tsx
'use client';


import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ContentBlock, TextContentBlock, ImageContentBlock } from '@/types/index';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const MAX_IMAGE_DISPLAY_WIDTH = 700;

interface PresentationDisplayClientProps {
  contentBlocks: ContentBlock[];
}


const PresentationDisplayClient: React.FC<PresentationDisplayClientProps> = ({ contentBlocks }) => {
  const [domPurify, setDomPurify] = useState<any>(null);

  useEffect(() => {
    import('dompurify').then((mod) => setDomPurify(mod.default));
  }, []);

  return (
    <div className={`${inter.className} space-y-8 w-full`}>
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

          let imageUrlForDisplay = imageBlock.url;
          if (imageUrlForDisplay && !imageUrlForDisplay.startsWith('http://') && !imageUrlForDisplay.startsWith('https://') && !imageUrlForDisplay.startsWith('data:') && !imageUrlForDisplay.startsWith('blob:')) {
            if (imageUrlForDisplay.startsWith('//')) {
                imageUrlForDisplay = imageUrlForDisplay.substring(2);
            }
            if (imageUrlForDisplay.startsWith('app/')) {
                imageUrlForDisplay = imageUrlForDisplay.substring(4);
            }
            if (!imageUrlForDisplay.startsWith('/')) {
                imageUrlForDisplay = `/${imageUrlForDisplay}`;
            }
          }

          const effectiveWidth = imageBlock.width || imageBlock.originalWidth || 800;
          const effectiveHeight = imageBlock.height || imageBlock.originalHeight || Math.round(effectiveWidth * (9/16));

          return (
            <figure key={block.id || index} className="my-0 p-0 w-full flex flex-col items-center">
              {imageUrlForDisplay && (
                <div 
                  className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-lg shadow-md bg-gray-100 flex items-center justify-center p-0 m-0"
                  style={{
                      width: effectiveWidth ? `${effectiveWidth}px` : '100%', 
                      height: effectiveHeight ? `${effectiveHeight}px` : 'auto', 
                      maxWidth: '100%', 
                      maxHeight: '400px', 
                  }} 
                >
                  <Image
                    src={imageUrlForDisplay}
                    alt={imageBlock.altText || 'Presentation image'}
                    width={effectiveWidth} 
                    height={effectiveHeight} 
                    className="object-contain w-full h-full" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                    priority={index < 2} 
                    unoptimized={false} 
                    onError={(e) => {
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
};

export default PresentationDisplayClient;
