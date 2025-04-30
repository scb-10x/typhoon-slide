'use client';

import React from 'react';
import MDXProviderWrapper from './MDXProvider';

interface MDXSlideProps {
  content: React.ReactNode;
}

/**
 * A component that renders MDX content with proper styling for slides
 * Using responsive scaling for better fullscreen presentation
 */
export default function MDXSlide({ content }: MDXSlideProps) {
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="text-[clamp(1.25rem,3vw,2rem)] font-bold mb-[clamp(0.25rem,1vh,0.75rem)]">Empty Slide</div>
        <p className="text-[clamp(0.875rem,2vw,1.25rem)]">This slide has no content</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-[clamp(0.5rem,2vw,2rem)]" id="mdx-slide-container">
      <div className="slide-content max-h-full max-w-full overflow-auto p-[clamp(0.5rem,2vw,2rem)] prose-headings:leading-[1.2] prose-p:leading-[1.5]" id="mdx-slide-content">
        <MDXProviderWrapper>{content}</MDXProviderWrapper>
      </div>
    </div>
  );
} 