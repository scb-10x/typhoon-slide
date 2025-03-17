'use client';

import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import { useMDXComponents } from '@/lib/mdx-components';

interface MDXProviderWrapperProps {
  children: React.ReactNode;
}

export default function MDXProviderWrapper({ children }: MDXProviderWrapperProps) {
  const components = useMDXComponents();
  
  return (
    <MDXProvider components={components}>
      {children}
    </MDXProvider>
  );
} 