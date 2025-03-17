import type { Config } from 'tailwindcss'
import typography from "@tailwindcss/typography"

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'var(--tw-prose-body)',
            '[class~="lead"]': {
              color: 'var(--tw-prose-lead)',
            },
            a: {
              color: 'var(--tw-prose-links)',
              textDecoration: 'underline',
              fontWeight: '500',
            },
            strong: {
              color: 'var(--tw-prose-bold)',
              fontWeight: '600',
            },
            'a strong': {
              color: 'inherit',
            },
            'blockquote strong': {
              color: 'inherit',
            },
            'thead strong': {
              color: 'inherit',
            },
            h1: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '800',
              fontSize: 'em(36, 16)',
              marginTop: '0',
              marginBottom: '0.8333333em',
              lineHeight: '1.1111111',
            },
            h2: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '700',
              fontSize: 'em(24, 16)',
              marginTop: '2em',
              marginBottom: '1em',
              lineHeight: '1.3333333',
            },
            h3: {
              color: 'var(--tw-prose-headings)',
              fontSize: 'em(20, 16)',
              marginTop: '1.6em',
              marginBottom: '0.6em',
              lineHeight: '1.6',
            },
            h4: {
              color: 'var(--tw-prose-headings)',
              marginTop: '1.5em',
              marginBottom: '0.5em',
              lineHeight: '1.5',
            },
            code: {
              color: 'var(--tw-prose-code)',
              fontWeight: '600',
              fontSize: '0.875em',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            pre: {
              overflow: 'auto',
              backgroundColor: 'var(--tw-prose-pre-bg)',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: 'inherit',
              fontSize: 'inherit',
              color: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            'pre code::before': {
              content: 'none',
            },
            'pre code::after': {
              content: 'none',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.625em',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.625em',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
  darkMode: 'class',
}

export default config 