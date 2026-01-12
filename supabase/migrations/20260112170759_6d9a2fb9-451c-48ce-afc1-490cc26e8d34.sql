-- Fix shared_links table: remove overly permissive policy
DROP POLICY IF EXISTS "Anyone can view shared links by token" ON public.shared_links;