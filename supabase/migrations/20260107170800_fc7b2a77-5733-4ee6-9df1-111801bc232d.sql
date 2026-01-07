-- Create trash table for recycle bin
CREATE TABLE public.trash (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    original_file_id UUID,
    name TEXT NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    original_folder_path TEXT DEFAULT '/',
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trash" ON public.trash FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trash" ON public.trash FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trash" ON public.trash FOR DELETE USING (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    file_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, file_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Create recent_files table
CREATE TABLE public.recent_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    file_id UUID NOT NULL,
    accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, file_id)
);

ALTER TABLE public.recent_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recent files" ON public.recent_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recent files" ON public.recent_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recent files" ON public.recent_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recent files" ON public.recent_files FOR DELETE USING (auth.uid() = user_id);

-- Create shared_links table
CREATE TABLE public.shared_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    file_id UUID NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    password TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER NOT NULL DEFAULT 0,
    max_downloads INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shared links" ON public.shared_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own shared links" ON public.shared_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shared links" ON public.shared_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shared links" ON public.shared_links FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared links by token" ON public.shared_links FOR SELECT USING (true);

-- Create offline_files table
CREATE TABLE public.offline_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    file_id UUID NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    cache_size BIGINT NOT NULL DEFAULT 0,
    UNIQUE(user_id, file_id)
);

ALTER TABLE public.offline_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own offline files" ON public.offline_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own offline files" ON public.offline_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offline files" ON public.offline_files FOR DELETE USING (auth.uid() = user_id);

-- Create backup_schedules table
CREATE TABLE public.backup_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    folder_paths TEXT[] DEFAULT ARRAY['/']::TEXT[],
    frequency TEXT NOT NULL DEFAULT 'daily',
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backup schedules" ON public.backup_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own backup schedules" ON public.backup_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own backup schedules" ON public.backup_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own backup schedules" ON public.backup_schedules FOR DELETE USING (auth.uid() = user_id);

-- Add is_deleted column to files table for soft delete
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Create function to auto-delete expired trash
CREATE OR REPLACE FUNCTION public.cleanup_expired_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.trash WHERE expires_at < now();
END;
$$;