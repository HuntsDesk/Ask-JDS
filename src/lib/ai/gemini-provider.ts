import type { AIProvider } from '@/types/ai';
import type { Message } from '@/types';
import { prepareConversationHistory } from '../token-utils';
import { getSystemPrompt } from '../system-prompt';
import { supabase } from '../supabase';

export class GeminiProvider implements AIProvider {
  constructor(private settings: { model: string; provider: string }) {}

  async generateResponse(prompt: string, threadMessages: Message[] = []): Promise<string> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        console.log(`🚀🚀🚀 USING GEMINI PROVIDER (Attempt ${attempt}/${maxRetries}) 🚀🚀🚀`);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('🚫 No active session found');
        throw new Error('No active session');
      }

      // Format messages for the Gemini API
      const messages = threadMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add the new user message
      messages.push({
        role: 'user',
        content: prompt
      });
      
      console.log('Sending request to Gemini:', {
        model: this.settings.model,
          messagesCount: messages.length,
          attempt: attempt
      });

        // Set up AbortController for timeout - increased to 90 seconds
      const controller = new AbortController();
        const timeoutDuration = 90000; // 90 seconds
        const timeoutId = setTimeout(() => {
          console.warn(`⏱️ Gemini request timeout after ${timeoutDuration/1000}s (attempt ${attempt})`);
          controller.abort();
        }, timeoutDuration);

      const baseUrl = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
      const url = `${baseUrl}/functions/v1/chat-google`;
        const startTime = Date.now();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages }),
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        console.log(`✅ Gemini API response received in ${duration}ms (attempt ${attempt})`);

      if (!response.ok) {
        console.error('Gemini API error:', response.status, await response.text());
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini API response:', data);

      return data.choices?.[0]?.message?.content || 'Error retrieving response';
    } catch (error) {
        const duration = Date.now() - (Date.now() - 90000); // Approximate
        console.error(`❌ Error calling Gemini API (attempt ${attempt}/${maxRetries}):`, error);
        
        lastError = error instanceof Error ? error : new Error(String(error));
        
      if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn(`⏱️ Request timed out after 90 seconds (attempt ${attempt}/${maxRetries})`);
          lastError = new Error(`The AI service is taking too long to respond (attempt ${attempt}/${maxRetries}). ${attempt < maxRetries ? 'Retrying...' : 'Please try again later.'}`);
      }
        
        // If this is not the last attempt and it's a timeout, retry
        if (attempt < maxRetries && (error instanceof DOMException && error.name === 'AbortError')) {
          console.log(`🔄 Retrying Gemini request (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
          continue;
    }
        
        // If it's the last attempt or a non-retryable error, throw
        throw lastError;
      }
    }
    
    // This should never be reached, but just in case
    throw lastError || new Error('Unknown error in Gemini provider');
  }

  async generateThreadTitle(prompt: string): Promise<string> {
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        console.log(`🚀 Gemini Provider - Generating Thread Title (Attempt ${attempt}/${maxRetries})`);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('🚫 No active session found for thread title generation');
        return 'New Chat';
      }
      
      // Create special prompt for title generation
      const titlePrompt = `Generate a short, descriptive title (maximum 50 characters) that captures the main topic of this message: "${prompt}"`;
      
        // Set up timeout - increased to 45 seconds for title generation
      const controller = new AbortController();
        const timeoutDuration = 45000; // 45 seconds
        const timeoutId = setTimeout(() => {
          console.warn(`⏱️ Title generation timeout after ${timeoutDuration/1000}s (attempt ${attempt})`);
          controller.abort();
        }, timeoutDuration);
      
      const baseUrl = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
      const url = `${baseUrl}/functions/v1/chat-google`;
        const startTime = Date.now();
      
      console.log('Sending thread title generation request with header and body param');
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
          'X-Request-Type': 'thread-title' // Signal that this is a thread title request
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: titlePrompt }],
          title_generation: true // Also include as body parameter for backward compatibility
        }),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        console.log(`✅ Title generation response received in ${duration}ms (attempt ${attempt})`);
      
      if (!response.ok) {
          console.error(`Gemini API error for title generation (attempt ${attempt}):`, response.status);
          if (attempt === maxRetries) {
        return 'New Chat';
          }
          throw new Error(`Title generation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract and clean the title
      let title = data.choices?.[0]?.message?.content || 'New Chat';
      
      // Trim it to ensure it's not too long
      title = title.trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      return title;
    } catch (error) {
        console.error(`Error generating thread title with Gemini (attempt ${attempt}/${maxRetries}):`, error);
        
        // If this is a timeout and not the last attempt, retry
        if (attempt < maxRetries && error instanceof DOMException && error.name === 'AbortError') {
          console.log(`🔄 Retrying title generation (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
          continue;
        }
        
        // For any error on the last attempt, return default title
        if (attempt === maxRetries) {
      return 'New Chat';
    }
      }
    }
    
    return 'New Chat';
  }
}