CREATE TABLE public.attribute_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  synonyms TEXT,
  source_sheet TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.attribute_catalog TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attribute_catalog TO authenticated;
GRANT ALL ON public.attribute_catalog TO service_role;
ALTER TABLE public.attribute_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the attribute catalog" ON public.attribute_catalog FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can upload catalog entries" ON public.attribute_catalog FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can clear catalog entries" ON public.attribute_catalog FOR DELETE TO anon, authenticated USING (true);