'use client';

import React, { useEffect, useRef, useState, ElementType } from 'react';

interface AutoSizeTextProps {
  children: React.ReactNode;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function AutoSizeText({
  children,
  className = '',
  minFontSize = 16,
  maxFontSize = 64,
  tag = 'div',
  ...rest
}: AutoSizeTextProps) {
  const textRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const resizeText = () => {
      if (!textRef.current || !containerRef.current) return;
      
      // Reset font size to maximum
      setFontSize(maxFontSize);
      textRef.current.style.fontSize = `${maxFontSize}px`;
      
      // Shrink text until it fits
      let currentSize = maxFontSize;
      while (
        textRef.current.scrollWidth > containerRef.current.clientWidth && 
        currentSize > minFontSize
      ) {
        currentSize--;
        textRef.current.style.fontSize = `${currentSize}px`;
      }
      
      setFontSize(currentSize);
    };

    resizeText();
    
    // Re-calculate on window resize
    window.addEventListener('resize', resizeText);
    return () => window.removeEventListener('resize', resizeText);
  }, [children, minFontSize, maxFontSize]);

  const Component = tag as ElementType;

  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden"
    >
      <Component
        ref={textRef}
        className={`${className} whitespace-nowrap overflow-hidden text-ellipsis`}
        style={{ fontSize: `${fontSize}px` }}
        {...rest}
      >
        {children}
      </Component>
    </div>
  );
} 