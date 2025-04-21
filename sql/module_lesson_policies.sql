-- Create RLS policy for modules and lessons
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all modules"
ON public.modules
FOR SELECT
USING (auth.role() = 'authenticated');

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all lessons"
ON public.lessons
FOR SELECT
USING (auth.role() = 'authenticated'); 