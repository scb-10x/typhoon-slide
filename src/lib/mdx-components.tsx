import React from 'react';
import type { MDXComponents } from 'mdx/types';
import ImageWithFallback from '@/components/ImageWithFallback';
import AutoSizeText from '@/components/AutoSizeText';

// Define custom MDX components that will be used for rendering
export function useMDXComponents(): MDXComponents {
  return {
    // Basic elements with responsive typography
    h1: (props) => (
      <AutoSizeText
        tag="h1"
        className="font-bold mb-[clamp(0.5rem,2vh,1.5rem)] text-blue-600 dark:text-blue-400"
        minFontSize={24}
        maxFontSize={56}
        {...props}
      />
    ),
    h2: (props) => (
      <AutoSizeText
        tag="h2"
        className="font-bold mb-[clamp(0.4rem,1.75vh,1.2rem)] text-blue-600/90 dark:text-blue-400/90"
        minFontSize={20}
        maxFontSize={40}
        {...props}
      />
    ),
    h3: (props) => (
      <AutoSizeText
        tag="h3"
        className="font-bold mb-[clamp(0.3rem,1.5vh,1rem)] text-blue-600/80 dark:text-blue-400/80"
        minFontSize={18}
        maxFontSize={32}
        {...props}
      />
    ),
    h4: (props) => <h4 className="text-[clamp(1.125rem,2.5vw,1.75rem)] font-bold mb-[clamp(0.25rem,1.25vh,0.75rem)] text-blue-600/70 dark:text-blue-400/70" {...props} />,
    h5: (props) => <h5 className="text-[clamp(0.875rem,2vw,1.25rem)] font-bold mb-[clamp(0.25rem,1vh,0.75rem)] text-blue-600/70 dark:text-blue-400/70" {...props} />,
    h6: (props) => <h6 className="text-[clamp(0.75rem,1.5vw,1rem)] font-bold mb-[clamp(0.25rem,1vh,0.75rem)] text-blue-600/60 dark:text-blue-400/60" {...props} />,
    
    p: (props) => <p className="text-[clamp(0.875rem,2vw,1.25rem)] mb-[clamp(0.5rem,2vh,1.5rem)]" {...props} />,
    
    // Lists
    ul: (props) => <ul className="list-disc pl-[clamp(1rem,3vw,1.5rem)] mb-[clamp(0.5rem,2vh,1.5rem)] space-y-[clamp(0.25rem,1vh,0.75rem)]" {...props} />,
    ol: (props) => <ol className="list-decimal pl-[clamp(1rem,3vw,1.5rem)] mb-[clamp(0.5rem,2vh,1.5rem)] space-y-[clamp(0.25rem,1vh,0.75rem)]" {...props} />,
    li: (props) => <li className="text-[clamp(0.875rem,2vw,1.25rem)]" {...props} />,
    
    // Emphasis
    strong: (props) => <strong className="font-bold" {...props} />,
    em: (props) => <em className="italic" {...props} />,
    
    // Links and images
    a: (props) => <a className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline" {...props} />,
    img: (props) => <ImageWithFallback className="max-w-full h-auto my-[clamp(0.5rem,2vh,1.5rem)] rounded-lg shadow-md" {...props} />,
    
    // Special elements
    blockquote: (props) => (
      <blockquote className="border-l-4 border-blue-400 dark:border-blue-600 pl-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.25rem,1vh,0.75rem)] my-[clamp(0.5rem,2vh,1.5rem)] bg-blue-50 dark:bg-blue-900/20 rounded-sm" {...props} />
    ),
    
    // Code blocks
    code: (props) => {
      const { children, className, ...rest } = props;
      const isInline = !className?.startsWith('language-');
      
      return isInline ? (
        <code 
          className="font-mono bg-gray-100 dark:bg-gray-800 text-[clamp(0.75rem,1.75vw,1rem)] px-1.5 py-0.5 rounded-md" 
          {...rest}
        >
          {children}
        </code>
      ) : (
        <pre className="font-mono text-[clamp(0.75rem,1.75vw,1rem)] bg-gray-100 dark:bg-gray-800 p-[clamp(0.5rem,2vh,1.5rem)] rounded-lg overflow-x-auto mb-[clamp(0.5rem,2vh,1.5rem)]">
          <code className={className} {...rest}>
            {children}
          </code>
        </pre>
      );
    },
    
    // Tables
    table: (props) => <table className="min-w-full border-collapse my-[clamp(0.5rem,2vh,1.5rem)]" {...props} />,
    thead: (props) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
    tbody: (props) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
    tr: (props) => <tr className="even:bg-gray-50 dark:even:bg-gray-900/50" {...props} />,
    th: (props) => <th className="py-[clamp(0.25rem,1vh,0.75rem)] px-[clamp(0.5rem,1.5vw,1rem)] text-left font-bold text-[clamp(0.75rem,1.75vw,1rem)]" {...props} />,
    td: (props) => <td className="py-[clamp(0.25rem,1vh,0.75rem)] px-[clamp(0.5rem,1.5vw,1rem)] text-[clamp(0.75rem,1.75vw,1rem)]" {...props} />,
    
    // Horizontal rule
    hr: () => <hr className="border-gray-300 dark:border-gray-700 my-[clamp(1rem,3vh,2rem)]" />,
  };
} 