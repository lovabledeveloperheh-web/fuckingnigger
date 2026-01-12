-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password_hash column to shared_links table
ALTER TABLE public.shared_links ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create rate limiting table for shared link password attempts
CREATE TABLE IF NOT EXISTS public.share_link_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL,
  client_ip TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_attempts_token_time 
  ON public.share_link_attempts(share_token, attempted_at);

-- Enable RLS on attempts table
ALTER TABLE public.share_link_attempts ENABLE ROW LEVEL SECURITY;

-- No direct access to attempts table - only via function
-- No RLS policy needed as we use SECURITY DEFINER function

-- Create secure function to create shared links with hashed passwords
CREATE OR REPLACE FUNCTION public.create_secure_share_link(
  p_file_id UUID,
  p_share_token TEXT,
  p_password TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_max_downloads INTEGER DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  file_id UUID,
  share_token TEXT,
  expires_at TIMESTAMPTZ,
  max_downloads INTEGER,
  download_count INTEGER,
  created_at TIMESTAMPTZ,
  has_password BOOLEAN
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
  v_new_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Hash password if provided
  IF p_password IS NOT NULL AND p_password != '' THEN
    v_password_hash := crypt(p_password, gen_salt('bf', 8));
  ELSE
    v_password_hash := NULL;
  END IF;
  
  -- Insert the new shared link
  INSERT INTO shared_links (
    user_id,
    file_id,
    share_token,
    password_hash,
    expires_at,
    max_downloads
  ) VALUES (
    v_user_id,
    p_file_id,
    p_share_token,
    v_password_hash,
    p_expires_at,
    p_max_downloads
  )
  RETURNING shared_links.id INTO v_new_id;
  
  -- Return the created link (without exposing password hash)
  RETURN QUERY 
  SELECT 
    sl.id,
    sl.file_id,
    sl.share_token,
    sl.expires_at,
    sl.max_downloads,
    sl.download_count,
    sl.created_at,
    (sl.password_hash IS NOT NULL) as has_password
  FROM shared_links sl
  WHERE sl.id = v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Create secure function to verify shared link access (server-side password verification with rate limiting)
CREATE OR REPLACE FUNCTION public.verify_shared_link_access(
  p_share_token TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS TABLE(
  valid BOOLEAN,
  rate_limited BOOLEAN,
  requires_password BOOLEAN,
  file_id UUID,
  link_id UUID,
  file_name TEXT,
  file_size BIGINT,
  file_mime_type TEXT,
  file_storage_path TEXT,
  download_count INTEGER,
  max_downloads INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link shared_links;
  v_file files;
  v_recent_attempts INTEGER;
BEGIN
  -- Check rate limit: max 5 failed attempts per share token per hour
  SELECT COUNT(*) INTO v_recent_attempts
  FROM share_link_attempts
  WHERE share_link_attempts.share_token = p_share_token
    AND attempted_at > NOW() - INTERVAL '1 hour'
    AND success = false;
  
  IF v_recent_attempts >= 5 THEN
    -- Log the rate-limited attempt
    INSERT INTO share_link_attempts (share_token, success)
    VALUES (p_share_token, false);
    
    RETURN QUERY SELECT 
      false::BOOLEAN, 
      true::BOOLEAN, 
      false::BOOLEAN, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::BIGINT, 
      NULL::TEXT, 
      NULL::TEXT,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Get the shared link
  SELECT * INTO v_link
  FROM shared_links sl
  WHERE sl.share_token = p_share_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false::BOOLEAN, 
      false::BOOLEAN, 
      false::BOOLEAN, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::BIGINT, 
      NULL::TEXT, 
      NULL::TEXT,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      false::BOOLEAN, 
      false::BOOLEAN, 
      false::BOOLEAN, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::BIGINT, 
      NULL::TEXT, 
      NULL::TEXT,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check download limit
  IF v_link.max_downloads IS NOT NULL AND v_link.download_count >= v_link.max_downloads THEN
    RETURN QUERY SELECT 
      false::BOOLEAN, 
      false::BOOLEAN, 
      false::BOOLEAN, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::BIGINT, 
      NULL::TEXT, 
      NULL::TEXT,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if password is required
  IF v_link.password_hash IS NOT NULL THEN
    IF p_password IS NULL OR p_password = '' THEN
      -- Password required but not provided
      RETURN QUERY SELECT 
        false::BOOLEAN, 
        false::BOOLEAN, 
        true::BOOLEAN, 
        NULL::UUID, 
        NULL::UUID, 
        NULL::TEXT, 
        NULL::BIGINT, 
        NULL::TEXT, 
        NULL::TEXT,
        NULL::INTEGER,
        NULL::INTEGER;
      RETURN;
    ELSIF crypt(p_password, v_link.password_hash) = v_link.password_hash THEN
      -- Correct password - log success
      INSERT INTO share_link_attempts (share_token, success)
      VALUES (p_share_token, true);
      
      -- Get file info
      SELECT * INTO v_file
      FROM files f
      WHERE f.id = v_link.file_id;
      
      IF NOT FOUND THEN
        RETURN QUERY SELECT 
          false::BOOLEAN, 
          false::BOOLEAN, 
          false::BOOLEAN, 
          NULL::UUID, 
          NULL::UUID, 
          NULL::TEXT, 
          NULL::BIGINT, 
          NULL::TEXT, 
          NULL::TEXT,
          NULL::INTEGER,
          NULL::INTEGER;
        RETURN;
      END IF;
      
      RETURN QUERY SELECT 
        true::BOOLEAN, 
        false::BOOLEAN, 
        true::BOOLEAN, 
        v_file.id, 
        v_link.id, 
        v_file.name, 
        v_file.size, 
        v_file.mime_type, 
        v_file.storage_path,
        v_link.download_count,
        v_link.max_downloads;
      RETURN;
    ELSE
      -- Incorrect password - log failure
      INSERT INTO share_link_attempts (share_token, success)
      VALUES (p_share_token, false);
      
      RETURN QUERY SELECT 
        false::BOOLEAN, 
        false::BOOLEAN, 
        true::BOOLEAN, 
        NULL::UUID, 
        NULL::UUID, 
        NULL::TEXT, 
        NULL::BIGINT, 
        NULL::TEXT, 
        NULL::TEXT,
        NULL::INTEGER,
        NULL::INTEGER;
      RETURN;
    END IF;
  ELSE
    -- No password required - get file info directly
    SELECT * INTO v_file
    FROM files f
    WHERE f.id = v_link.file_id;
    
    IF NOT FOUND THEN
      RETURN QUERY SELECT 
        false::BOOLEAN, 
        false::BOOLEAN, 
        false::BOOLEAN, 
        NULL::UUID, 
        NULL::UUID, 
        NULL::TEXT, 
        NULL::BIGINT, 
        NULL::TEXT, 
        NULL::TEXT,
        NULL::INTEGER,
        NULL::INTEGER;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT 
      true::BOOLEAN, 
      false::BOOLEAN, 
      false::BOOLEAN, 
      v_file.id, 
      v_link.id, 
      v_file.name, 
      v_file.size, 
      v_file.mime_type, 
      v_file.storage_path,
      v_link.download_count,
      v_link.max_downloads;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment download count (server-side)
CREATE OR REPLACE FUNCTION public.increment_shared_link_download(
  p_link_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shared_links
  SET download_count = download_count + 1
  WHERE id = p_link_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing plaintext passwords to hashed (if any exist)
UPDATE shared_links 
SET password_hash = crypt(password, gen_salt('bf', 8))
WHERE password IS NOT NULL 
  AND password != '' 
  AND password_hash IS NULL;

-- Drop the plaintext password column after migration
ALTER TABLE public.shared_links DROP COLUMN IF EXISTS password;

-- Clean up old attempts after 7 days (create a scheduled job would be better, but this helps)
DELETE FROM share_link_attempts WHERE attempted_at < NOW() - INTERVAL '7 days';