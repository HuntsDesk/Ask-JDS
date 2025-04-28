import type { AIProvider } from '@/types/ai';
import type { Message } from '@/types';
import { callAIRelay } from './relay-utils';
import { getSystemPrompt } from '@/lib/system-prompt';

export class OpenAIProvider implements AIProvider {
  constructor(private settings: { model: string; provider: string }) {}

  async generateResponse(prompt: string, threadMessages: Message[] = []): Promise<string> {
    try {
      console.log('🔵🔵🔵 USING OPENAI PROVIDER 🔵🔵🔵');
      const systemPrompt = await getSystemPrompt();
      
      // Format messages correctly for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...threadMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: prompt }
      ];

      // Use the model from settings, defaulting to gpt-4o if not specified
      const model = this.settings.model || 'gpt-4o';
      
      console.log('📤 OpenAI Provider - Sending Request:', {
        model,
        messagesCount: messages.length,
        roles: messages.map(m => m.role)
      });

      const data = await callAIRelay(
        'openai',
        model,
        prompt,
        messages
      );

      console.log('✅ OpenAI Provider - Response Received');
      return data.choices?.[0]?.message?.content || 'Error retrieving response';
    } catch (error) {
      console.error('❌ OpenAI Provider - Error:', error);
      
      // Provide a more user-friendly error message
      if (error instanceof Error) {
        // If it's already a user-friendly error from relay-utils, pass it through
        if (error.message.includes("Network connection to AI service was lost")) {
          throw error;
        }
        
        // For other errors, provide a generic message
        throw new Error("Unable to generate AI response. Please try again later.");
      }
      
      throw error;
    }
  }

  async generateThreadTitle(prompt: string): Promise<string> {
    try {
      console.log('🔵 OpenAI Provider - Generating Thread Title');
      
      // Create a system prompt specifically for generating a title
      const titleSystemPrompt = "Generate a concise and descriptive title (max 50 characters) for a conversation that starts with this message. The title should clearly indicate the main topic or question.";
      
      // Format messages for title generation
      const messages = [
        { role: 'system', content: titleSystemPrompt },
        { role: 'user', content: prompt }
      ];
      
      // Use a smaller model for title generation if available
      const model = this.settings.model || 'gpt-4o';
      
      const data = await callAIRelay(
        'openai',
        model,
        prompt,
        messages
      );
      
      // Extract and clean the title
      let title = data.choices?.[0]?.message?.content || 'New Chat';
      
      // Trim it to ensure it's not too long
      title = title.trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      return title;
    } catch (error) {
      console.error('Error generating thread title:', error);
      return 'New Chat';
    }
  }
}