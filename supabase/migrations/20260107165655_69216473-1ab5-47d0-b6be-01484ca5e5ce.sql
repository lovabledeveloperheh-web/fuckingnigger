-- Update storage limit to 1 Petabyte (1,125,899,906,842,624 bytes)
ALTER TABLE public.profiles 
ALTER COLUMN storage_limit SET DEFAULT 1125899906842624;

-- Update existing profiles to new limit
UPDATE public.profiles SET storage_limit = 1125899906842624;

-- Add sync status tracking table
CREATE TABLE public.sync_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_syncing BOOLEAN NOT NULL DEFAULT false,
    total_files INTEGER NOT NULL DEFAULT 0,
    synced_files INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sync_status
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Sync status policies
CREATE POLICY "Users can view their own sync status" 
ON public.sync_status FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync status" 
ON public.sync_status FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync status" 
ON public.sync_status FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for sync_status timestamps
CREATE TRIGGER update_sync_status_updated_at
BEFORE UPDATE ON public.sync_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add passkey credentials table for WebAuthn
CREATE TABLE public.passkey_credentials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    device_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on passkey_credentials
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

-- Passkey policies
CREATE POLICY "Users can view their own passkeys" 
ON public.passkey_credentials FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passkeys" 
ON public.passkey_credentials FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkeys" 
ON public.passkey_credentials FOR DELETE 
USING (auth.uid() = user_id);