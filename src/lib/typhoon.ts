import { TYPHOON_BASE_URL } from '@/const';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Creates a Typhoon API client that's compatible with OpenAI
 * @param modelId The model ID to use
 * @returns A configured Typhoon API client
 */
export const typhoon = (modelId: string) => {
  const client = createOpenAI({
    baseURL: TYPHOON_BASE_URL,
    apiKey: process.env.TYPHOON_API_KEY || '',
    name: 'typhoon', // Change the provider name to typhoon
    compatibility: 'compatible', // Use compatible mode for 3rd party providers
  });
  
  return client(modelId);
}; 