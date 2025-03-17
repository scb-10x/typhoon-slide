This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Setting up your OpenAI API Key

This application uses the OpenAI API to generate MDX slide content. You'll need to set up your API key:

1. Create a `.env.local` file in the root directory
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. You can get an API key from [OpenAI's platform](https://platform.openai.com/api-keys)

⚠️ **Important**: Never commit your `.env.local` file to version control.

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Create slides using MDX syntax
- AI-powered content generation using OpenAI (securely via server-side API)
- Live preview of slides
- Simple, intuitive interface
- Markdown editor with syntax highlighting
- Dark mode support

## How to Use

1. Write your slide content using Markdown syntax
2. Separate slides with `---`
3. Use the AI chat to generate slide content based on your prompts
4. Preview your slides in real-time

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

When deploying, make sure to set the `OPENAI_API_KEY` environment variable in your Vercel project settings.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
