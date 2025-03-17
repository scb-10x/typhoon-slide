import { compileMDX } from 'next-mdx-remote/rsc';

export async function compileMdx(source: string) {
  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: true,
    },
  });

  return {
    content,
  };
}

export function splitIntoSlides(mdxContent: string): string[] {
  // Split the content by "---" which is the standard slide separator in presentation formats
  return mdxContent
    .split('---')
    .map(slide => slide.trim())
    .filter(Boolean); // Remove empty slides
} 