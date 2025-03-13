CREATE OR REPLACE FUNCTION public.set_flashcard_creator() 
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If created_by is not provided, set it to the current user
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  -- We no longer inherit is_official from a collection since we can have multiple
  -- For simplicity, if is_official isn't explicitly set, default to false
  IF NEW.is_official IS NULL THEN
    NEW.is_official := false;
  END IF;
  
  RETURN NEW;
END;
$function$; 