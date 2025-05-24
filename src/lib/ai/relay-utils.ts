import { supabase } from '../supabase';
import { AIResponse } from '@/types';
import { handleSessionExpiration } from '../auth';

type AIResponse = {
  choices?: Array<{ message: { content: string } }>;
  candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
};

export async function callAIRelay(
  provider: string, 
  model: string, 
  prompt: string, 
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('🚫 No active session found');
      // Handle session expiration
      handleSessionExpiration();
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Ensure messages is always an array
    const requestBody = {
      provider,
      model,
      prompt,
      messages: messages ?? []
    };

    const baseUrl = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
    const url = `${baseUrl}/functions/v1/chat-relay`;

    console.log('🚀 Sending AI Relay Request:', {
      url,
      provider,
      model,
      promptLength: prompt.length,
      messagesCount: messages?.length || 0
    });

    // Set up AbortController for timeout - increased to match Gemini provider
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);

      // Check for auth errors first
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Authentication error:', response.status);
        
        // Get specific error details if available
        let errorDetails = "Your session has expired.";
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorDetails = errorData.error.message;
          } else if (errorData?.message) {
            errorDetails = errorData.message;
          }
          console.log('Auth error details:', errorDetails);
        } catch (e) {
          // Unable to parse error details, use default message
        }
        
        // Add recovery instructions to the error message
        const errorMessage = `Session expired: ${errorDetails} Please sign in again to continue your conversation.`;
        
        // Get any potential message from the request body if available
        let preservedMessage = undefined;
        try {
          if (requestBody?.messages?.length > 0) {
            // Try to find the most recent user message
            const userMessages = requestBody.messages.filter(m => m.role === 'user');
            if (userMessages.length > 0) {
              // Get the last user message
              preservedMessage = userMessages[userMessages.length - 1].content;
            }
          }
        } catch (e) {
          console.error('Error extracting message to preserve:', e);
        }
        
        // Handle session expiration with a slight delay to allow error to be visible
        setTimeout(() => {
          handleSessionExpiration(preservedMessage);
        }, 1000);
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        // Clone the response before parsing to be able to get the text if parsing fails
        const responseClone = response.clone();
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, get the raw text and log it
          const responseText = await responseClone.text();
          console.error('❌ JSON Parse Error:', {
            error: jsonError,
            responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
          });
          
          // Check for network connection issues
          if (responseText.includes("Network connection lost")) {
            throw new Error("Network connection to AI service was lost. Please try again.");
          }
          
          throw jsonError;
        }
      } catch (error) {
        console.error('❌ Response Parsing Error:', error);
        throw error;
      }

      if (!response.ok) {
        console.error('❌ AI Relay Error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        // More specific error handling for common cases
        if (data.error?.message?.includes('auth') || 
            data.error?.message?.includes('token') || 
            data.error?.message?.includes('session')) {
          // Handle session expiration
          handleSessionExpiration();
          throw new Error('Your session has expired. Please sign in again.');
        }
        
        throw new Error(`AI Relay failed: ${data.error?.message || data.error || response.statusText}`);
      }

      console.log('✅ AI Relay Success:', {
        status: response.status,
        dataLength: JSON.stringify(data).length
      });

      return data;
    } catch (error) {
      // Specific handling for AbortController timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('⏱️ AI Relay Timeout: Request aborted after 90 seconds');
        throw new Error("The AI service is taking too long to respond. Please try again later.");
      }
      
      console.error('🔥 AI Relay Fatal Error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Check for auth-related errors
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || 
            error.message.includes('Authentication failed') || 
            error.message.includes('token') || 
            error.message.includes('expired')) {
          // Handle session expiration
          handleSessionExpiration();
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('🔥 AI Relay Request Setup Error:', error);
    throw error;
  }
}