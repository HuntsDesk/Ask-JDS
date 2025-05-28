-- Fix old prompts table reference in ensure_single_active_prompt function
-- This function should reference system_prompts table instead of the non-existent prompts table

CREATE OR REPLACE FUNCTION "public"."ensure_single_active_prompt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE system_prompts
  SET is_active = false
  WHERE user_id = NEW.user_id
    AND id <> NEW.id
    AND is_active = true;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."ensure_single_active_prompt"() IS 'Updated to reference system_prompts table instead of non-existent prompts table'; 