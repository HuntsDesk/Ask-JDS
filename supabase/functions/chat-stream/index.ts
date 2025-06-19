import { createClient } from 'npm:@supabase/supabase-js@2.8.0';
import { getConfig, getModelEndpoint } from '../_shared/config.ts';

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
let cachedSystemPrompt = null;

/**
 * Parse JSON streaming response from Google Gemini
 * Extracts text content from newline-delimited JSON chunks
 */
function createStreamParser(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  let buffer = '';
  
  return new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      console.log(`🔍 Raw chunk received (${text.length} chars):`, JSON.stringify(text.substring(0, 200)));
      buffer += text;
      
      // Try different parsing strategies
      // Strategy 1: Split by comma and newline (original approach)
      let parts = buffer.split(',\r\n');
      if (parts.length === 1) {
        // Strategy 2: Split by just newline
        parts = buffer.split('\n');
      }
      if (parts.length === 1) {
        // Strategy 3: Split by comma
        parts = buffer.split(',');
      }
      
      console.log(`🔍 Split into ${parts.length} parts using buffer length ${buffer.length}`);
      
      // Keep the last incomplete part in buffer
      buffer = parts.pop() || '';
      
      for (let i = 0; i < parts.length; i++) {
        const jsonPart = parts[i];
        let trimmed = jsonPart.trim();
        if (!trimmed) continue;
        
        // Remove array brackets if present
        trimmed = trimmed.replace(/^\s*\[/, '').replace(/\]\s*$/, '');
        if (!trimmed) continue;
        
        console.log(`🔍 Processing part ${i}: "${trimmed.substring(0, 100)}..."`);
        
        try {
          const data = JSON.parse(trimmed);
          console.log(`🔍 Parsed JSON:`, JSON.stringify(data, null, 2).substring(0, 300));
          
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`🔍 Extracted text: "${text.substring(0, 50)}..."`);
            // Format as Server-Sent Events
            const sseData = `data: ${JSON.stringify({ text })}\n\n`;
            controller.enqueue(new TextEncoder().encode(sseData));
          } else {
            console.log(`🔍 No text found in candidates structure`);
          }
        } catch (error) {
          console.warn(`❌ Parse error for: "${trimmed.substring(0, 50)}..."`, error);
          
          // Try parsing as a simple text response (fallback)
          if (trimmed.includes('"text"')) {
            try {
              const textMatch = trimmed.match(/"text":\s*"([^"]+)"/);
              if (textMatch && textMatch[1]) {
                const extractedText = textMatch[1];
                console.log(`🔍 Fallback extracted text: "${extractedText}"`);
                const sseData = `data: ${JSON.stringify({ text: extractedText })}\n\n`;
                controller.enqueue(new TextEncoder().encode(sseData));
              }
            } catch (fallbackError) {
              console.warn(`❌ Fallback parse also failed:`, fallbackError);
            }
          }
        }
      }
    },
    
    flush(controller) {
      console.log(`🔍 Flush called with remaining buffer: "${buffer.substring(0, 100)}..."`);
      
      // Process any remaining complete JSON in buffer
      if (buffer.trim()) {
        let trimmed = buffer.trim().replace(/^\s*\[/, '').replace(/\]\s*$/, '');
        if (trimmed) {
          try {
            const data = JSON.parse(trimmed);
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log(`🔍 Flush extracted text: "${text.substring(0, 50)}..."`);
              const sseData = `data: ${JSON.stringify({ text })}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));
            }
          } catch (error) {
            console.warn(`❌ Flush parse error: "${trimmed.substring(0, 50)}..."`, error);
          }
        }
      }
      
      // Send completion marker
      console.log(`🔍 Sending completion marker`);
      const doneData = `data: [DONE]\n\n`;
      controller.enqueue(new TextEncoder().encode(doneData));
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

    console.log(`Streaming chat request - User: ${user.id}, Tier: ${userTier}, Model: ${modelCodeName}`);

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

    console.log(`Making streaming request to: ${GOOGLE_STREAMING_URL}`);

    // Make streaming request to Gemini
    const geminiResponse = await fetch(`${GOOGLE_STREAMING_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

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

    // Create the stream parser and pipe the response through it
    const streamParser = createStreamParser();
    const textStream = geminiResponse.body.pipeThrough(streamParser);

    // Return the streaming response
    return new Response(textStream, {
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