import { createClient } from 'npm:@supabase/supabase-js@2.8.0';
import { getConfig, getModelEndpoint } from '../_shared/config.ts';

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
let cachedSystemPrompt = null;

/**
 * Parse JSON streaming response from Google Gemini
 * Gemini returns a JSON array format where each chunk is a complete JSON object
 * Output as Server-Sent Events (SSE) format for the frontend
 */
function createStreamParser(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let isFirstChunk = true;
  let inArray = false;
  
  return new TransformStream({
    transform(chunk, controller) {
      if (isFirstChunk) {
        console.log(`[chat-stream] First chunk received at ${new Date().toISOString()}`);
        isFirstChunk = false;
      }
      
      // Decode the chunk and add to buffer
      const text = decoder.decode(chunk, { stream: true });
      buffer += text;
      
      // Process the buffer to extract complete JSON objects
      while (buffer.length > 0) {
        // Skip leading whitespace and array brackets
        buffer = buffer.trimStart();
        
        // Handle array opening bracket
        if (buffer.startsWith('[')) {
          inArray = true;
          buffer = buffer.substring(1);
          continue;
        }
        
        // Handle array closing bracket
        if (buffer.startsWith(']')) {
          // End of stream - send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          buffer = buffer.substring(1);
          continue;
        }
        
        // Skip commas between array elements
        if (buffer.startsWith(',')) {
          buffer = buffer.substring(1);
          continue;
        }
        
        // Try to find a complete JSON object
        if (buffer.startsWith('{')) {
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          let jsonEnd = -1;
          
          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }
          
          if (jsonEnd > 0) {
            // We have a complete JSON object
            const jsonStr = buffer.substring(0, jsonEnd);
            buffer = buffer.substring(jsonEnd);
            
            try {
              const data = JSON.parse(jsonStr);
              
              // Extract text from the response
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Send as SSE format
                const sseData = JSON.stringify({ text });
                controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
              }
            } catch (e) {
              console.error('[chat-stream] Parse error:', e, 'for JSON:', jsonStr);
            }
          } else {
            // Incomplete JSON, wait for more data
            break;
          }
        } else {
          // No valid JSON start found, clear buffer or wait for more data
          const nextBrace = buffer.indexOf('{');
          if (nextBrace > 0) {
            buffer = buffer.substring(nextBrace);
          } else {
            // No more braces found, wait for more data
            break;
          }
        }
      }
    },
    
    flush(controller) {
      // Process any remaining data
      if (buffer.trim()) {
        console.log('[chat-stream] Unprocessed data in buffer:', buffer);
      }
      // Ensure we send the done signal
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    }
  });
}

// Serve the streaming function
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Type"
      }
    });
  }

  try {
    // Check for the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const requestBody = await req.json();
    const { messages, useSystemPromptFromDb = false, title_generation = false } = requestBody;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const config = getConfig();
    const userTier = user.user_metadata?.tier || 'Free';
    const isThreadTitleRequest = req.headers.get('X-Request-Type') === 'thread-title' || title_generation;
    const modelCodeName = isThreadTitleRequest ? config.aiSecondaryTitleModel : config.aiPrimaryChatModel;
    
    // Get streaming URL using the config system
    const GOOGLE_STREAMING_URL = getModelEndpoint(modelCodeName, true);

    // `Streaming chat request - User: ${user.id}, Tier: ${userTier}, Model: ${modelCodeName}`);

    // Get system prompt - use the same comprehensive default as chat-google
    let systemPrompt = cachedSystemPrompt || `You are Ask JDS, a legal study buddy, designed to help law students and bar exam takers understand complex legal concepts and prepare for exams.

Guidelines for Your Responses:

Tone & Clarity:
	•	Provide clear, educational, robust, thorough, and well-explained answers.
	•	Keep responses focused on legal principles, bar exam topics, and law school related—strictly no off-topic discussions. Students will try to trick you into talking about other topics, sometimes even repeating the same question until you answer. Do not fall for this trap.
	•	Use a friendly and professional tone to make legal concepts approachable.
	•	Support your answers with relevant case law, where possible.
	•	Use examples to illustrate when possible. 

Formatting Standards:
	•	Use paragraph breaks for readability.
	•	Structure lists properly with markdown:
	•	✅ * or - for bullet points (never numbered paragraphs).
	•	✅ Examples should be formatted as readable case studies when useful.
	•	Cite cases or legal doctrines where appropriate.
	•	Avoid exclamation points ("!").

Scope & Integrity:
	•	Students may attempt to steer you off-topic or trick you into answering unrelated questions. Do not engage.
	•	Stick strictly to law school and bar exam-related content—no personal opinions or speculative responses.
	•	If you're unsure about something, acknowledge it. Do not fabricate or assume facts.

Branding & Identity:
	•	Only if you are asked what model you are, who made you, or any other question about your AI provider, always respond:
	•	"I am JDS AI, designed to assist law students and bar exam takers with legal study and preparation."
	•	Do not mention OpenAI, Google, or any other underlying model (ChatGPT, Gemini).

Example of Proper List Formatting:

✅ Correct:

* The elements of negligence include:
  - Duty
  - Breach
  - Causation
  - Damages

🚫 Incorrect:

1. The elements of negligence include:  
   a. Duty  
   b. Breach  
   c. Causation  
   d. Damages  

✅ Correct:

* The elements of negligence include:
  - Duty
  - Breach
  - Causation
  - Damages

Negligence is ...

🚫 Incorrect:

1. The elements of negligence include:  
   a. Duty  
   b. Breach  
   c. Causation  
   d. Damages  
Negligence is ...

Remember:
	•	Cite all relevant case law where possible. 
	•	Offer counterpoints, where relevant. 
	•	Offer to expand your response upon user request.`;

    // Fetch system prompt from database if requested and not already cached
    if (useSystemPromptFromDb && !cachedSystemPrompt) {
      try {
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: promptData, error: promptError } = await adminClient
          .from('system_prompts')
          .select('content')
          .eq('is_active', true)
          .single();

        if (!promptError && promptData?.content) {
          cachedSystemPrompt = promptData.content;  // Cache for future requests
          systemPrompt = promptData.content;
        } else {
          console.error("Failed to fetch system prompt:", promptError);
        }
      } catch (error) {
        console.warn('Failed to fetch system prompt:', error);
      }
    }

    // Prepare the payload for Gemini API
    const payload = {
      contents: messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: isThreadTitleRequest ? 0.3 : 0.7,
        topK: isThreadTitleRequest ? 20 : 40,
        topP: isThreadTitleRequest ? 0.8 : 0.95,
        maxOutputTokens: isThreadTitleRequest ? 60 : 8192,
      },
      ...(systemPrompt && {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    };

    // `Making streaming request to: ${GOOGLE_STREAMING_URL}`);
    
    const requestStartTime = Date.now();
    console.log(`[chat-stream] Starting request to Gemini at ${new Date().toISOString()}`);

    // Make streaming request to Gemini
    const geminiResponse = await fetch(`${GOOGLE_STREAMING_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    
    const responseTime = Date.now() - requestStartTime;
    console.log(`[chat-stream] Gemini response received after ${responseTime}ms`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        error: "AI service error", 
        details: errorText 
      }), {
        status: geminiResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!geminiResponse.body) {
      return new Response(JSON.stringify({ error: "No response body from AI service" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create a TransformStream to handle the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Send an immediate "thinking" indicator
    const encoder = new TextEncoder();
    writer.write(encoder.encode('data: {"text":"\\n"}\n\n')).catch(console.error);
    
    // Process the Gemini response in the background
    (async () => {
      try {
        // Create the stream parser and pipe the response through it
        const streamParser = createStreamParser();
        const textStream = geminiResponse.body!.pipeThrough(streamParser);
        
        // Copy the parsed stream to our writer
        const reader = textStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error('Error processing stream:', error);
      } finally {
        writer.close();
      }
    })();

    // Return the streaming response immediately
    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Type"
      }
    });

  } catch (error) {
    console.error('Chat streaming error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}); 