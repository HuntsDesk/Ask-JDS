-- Migration to update deprecated admin-check logic

ALTER POLICY "Admin users can update any flashcard_subjects" ON public.flashcard_subjects
USING (auth.is_admin(auth.uid()))
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can insert any flashcard_collections_junction" ON public.flashcard_collections_junction
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can update any flashcard_collections_junction" ON public.flashcard_collections_junction
USING (auth.is_admin(auth.uid()))
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can delete any flashcard_collections_junction" ON public.flashcard_collections_junction
USING (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can insert any flashcard_subjects" ON public.flashcard_subjects
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can delete any flashcard_subjects" ON public.flashcard_subjects
USING (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can insert any flashcard_exam_types" ON public.flashcard_exam_types
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can update any flashcard_exam_types" ON public.flashcard_exam_types
USING (auth.is_admin(auth.uid()))
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can delete any flashcard_exam_types" ON public.flashcard_exam_types
USING (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can insert any collection_subjects" ON public.collection_subjects
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can update any collection_subjects" ON public.collection_subjects
USING (auth.is_admin(auth.uid()))
WITH CHECK (auth.is_admin(auth.uid()));

ALTER POLICY "Admin users can delete any collection_subjects" ON public.collection_subjects
USING (auth.is_admin(auth.uid()));