import { serve } from "jsr:@std/http@^1.0.0/server";
serve(async (req)=>{
  // Add CORS headers for preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }
  try {
    const body = await req.json();
    console.log('Request body:', {
      provider: body.provider,
      model: body.model,
      promptLength: body?.prompt?.length,
      messagesCount: body?.messages?.length
    });
    const { provider, model, prompt, messages = [] } = body;
    if (!provider || !model || !prompt) {
      const error = {
        error: "Missing required fields",
        details: {
          provider,
          model,
          prompt: !!prompt
        }
      };
      console.error('Validation error:', error);
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    // Check if API keys are set
    const apiKey = provider === 'openai' ? Deno.env.get("OPENAI_API_KEY") : Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      const error = {
        error: `Missing API key for provider: ${provider}`
      };
      console.error('Configuration error:', error);
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    let apiUrl, requestBody, headers = {
      "Content-Type": "application/json"
    };
    switch(provider){
      case "openai":
        apiUrl = "https://api.openai.com/v1/chat/completions";
        requestBody = {
          model,
          messages: [
            ...messages,
            {
              role: "user",
              content: prompt
            }
          ]
        };
        headers["Authorization"] = `Bearer ${apiKey}`;
        break;
      case "google":
        apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        requestBody = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        };
        break;
      default:
        const error = {
          error: "Invalid provider",
          provider
        };
        console.error('Provider error:', error);
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }
    console.log('Making API request:', {
      url: apiUrl,
      provider,
      model,
      promptLength: prompt.length,
      messagesCount: messages.length
    });
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });
    const responseData = await response.json();
    console.log('API response:', {
      status: response.status,
      provider,
      model,
      data: responseData
    });
    if (!response.ok) {
      const error = {
        error: "API Error",
        status: response.status,
        provider,
        model,
        details: responseData
      };
      console.error('API error:', error);
      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error in chat-relay:', {
      message: error.message,
      stack: error.stack
    });
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
