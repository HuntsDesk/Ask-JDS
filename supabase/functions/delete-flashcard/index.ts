// deno-lint-ignore-file
import { createClient } from "npm:@supabase/supabase-js@2.38.0";

// Types for request and response
interface DeleteFlashcardRequest {
  flashcardId: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Initialize Supabase client with service role key for admin permissions
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function handleDeleteFlashcard(req: Request): Promise<Response> {
  // Authenticate user
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }), 
      { status: 401, headers: corsHeaders }
    );
  }

  // Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401, headers: corsHeaders }
    );
  }

  // Parse request body
  const { flashcardId } = await req.json() as DeleteFlashcardRequest;
  if (!flashcardId) {
    return new Response(
      JSON.stringify({ error: "Missing flashcard ID" }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    console.log(`Starting deletion process for flashcard ${flashcardId}`);
    
    // 1. First check that the flashcard exists and the user has permission to delete it
    const { data: flashcard, error: flashcardError } = await supabase
      .from('flashcards')
      .select('id, created_by, is_official')
      .eq('id', flashcardId)
      .single();
    
    if (flashcardError) {
      console.error('Error fetching flashcard:', flashcardError);
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Only allow deletion if the user created the card or it's not an official card
    if (flashcard.is_official && flashcard.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this flashcard' }),
        { status: 403, headers: corsHeaders }
      );
    }
    
    // 2. Delete related records in the flashcard_progress table
    console.log(`Deleting progress records for flashcard ${flashcardId}`);
    const { error: progressError } = await supabase
      .from('flashcard_progress')
      .delete()
      .eq('flashcard_id', flashcardId);
    
    if (progressError) {
      console.error('Error deleting flashcard progress:', progressError);
      // Continue anyway - we'll try to delete the flashcard
    }
    
    // 3. Delete related records in the flashcard_exam_types junction table
    console.log(`Deleting exam type records for flashcard ${flashcardId}`);
    const { error: examTypesError } = await supabase
      .from('flashcard_exam_types')
      .delete()
      .eq('flashcard_id', flashcardId);
    
    if (examTypesError) {
      console.error('Error deleting flashcard exam types:', examTypesError);
      // Continue anyway
    }
    
    // 4. Delete related records in the flashcard_collections_junction table
    console.log(`Deleting collection junction records for flashcard ${flashcardId}`);
    const { error: junctionError } = await supabase
      .from('flashcard_collections_junction')
      .delete()
      .eq('flashcard_id', flashcardId);
    
    if (junctionError) {
      console.error('Error deleting flashcard collections junction:', junctionError);
      // Continue anyway
    }
    
    // 5. Delete the flashcard itself
    console.log(`Deleting flashcard ${flashcardId}`);
    const { error: deleteError } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', flashcardId);
    
    if (deleteError) {
      console.error('Error deleting flashcard:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete flashcard', 
          details: deleteError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Successfully deleted
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Flashcard ${flashcardId} successfully deleted` 
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server error', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Main function to handle requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }
  
  return await handleDeleteFlashcard(req);
}); 