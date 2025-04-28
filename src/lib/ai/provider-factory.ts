import type { AIProvider, AISettings } from '@/types/ai';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';

const DEFAULT_SETTINGS: AISettings = {
  id: 'default',
  model: 'gemini-1.5-pro',
  provider: 'google',
  is_active: true,
  created_at: new Date().toISOString(),
  created_by: null
};

export function createAIProvider(settings: AISettings = DEFAULT_SETTINGS): AIProvider {
  const provider = getProviderByType(settings);
  
  // Ensure all required methods are available
  if (!provider.generateThreadTitle) {
    // Add a default implementation if missing
    provider.generateThreadTitle = async (prompt: string) => {
      // Generate a simple title from the prompt
      return prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
    };
  }
  
  return provider;
}

function getProviderByType(settings: AISettings): AIProvider {
  switch (settings.provider) {
    case 'openai':
      return new OpenAIProvider(settings);
    case 'google':
      return new GeminiProvider(settings);
    default:
      throw new Error(`Unsupported AI provider: ${settings.provider}`);
  }
} 