-- Enable realtime for files table to auto-sync updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;