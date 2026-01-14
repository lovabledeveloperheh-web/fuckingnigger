import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { notificationService } from '@/lib/notifications';

interface SharedLink {
  id: string;
  file_id: string;
  share_token: string;
  has_password: boolean;
  expires_at: string | null;
  download_count: number;
  max_downloads: number | null;
  created_at: string;
}

export const useSharing = () => {
  const { user } = useAuth();
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(false);

  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const fetchSharedLinks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch shared links - password_hash is not exposed, we check if it exists
      const { data, error } = await supabase
        .from('shared_links')
        .select('id, file_id, share_token, password_hash, expires_at, download_count, max_downloads, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map to include has_password instead of exposing hash
      const mappedLinks: SharedLink[] = (data || []).map(link => ({
        id: link.id,
        file_id: link.file_id,
        share_token: link.share_token,
        has_password: !!link.password_hash,
        expires_at: link.expires_at,
        download_count: link.download_count,
        max_downloads: link.max_downloads,
        created_at: link.created_at
      }));
      
      setSharedLinks(mappedLinks);
    } catch (error) {
      console.error('Error fetching shared links:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createShareLink = useCallback(async (
    fileId: string,
    options?: {
      password?: string;
      expiresAt?: Date;
      maxDownloads?: number;
    }
  ) => {
    if (!user) return null;
    
    try {
      const shareToken = generateToken();
      
      // Use secure RPC function that hashes passwords server-side
      const { data, error } = await supabase.rpc('create_secure_share_link', {
        p_file_id: fileId,
        p_share_token: shareToken,
        p_password: options?.password || null,
        p_expires_at: options?.expiresAt?.toISOString() || null,
        p_max_downloads: options?.maxDownloads || null
      });

      if (error) throw error;
      
      const result = data?.[0];
      if (!result) throw new Error('Failed to create share link');
      
      const newLink: SharedLink = {
        id: result.id,
        file_id: result.file_id,
        share_token: result.share_token,
        has_password: result.has_password,
        expires_at: result.expires_at,
        download_count: result.download_count,
        max_downloads: result.max_downloads,
        created_at: result.created_at
      };
      
      setSharedLinks(prev => [newLink, ...prev]);
      
      // Get file name for notification
      const { data: fileData } = await supabase
        .from('files')
        .select('name')
        .eq('id', fileId)
        .single();
      
      notificationService.notifyShareCreated(fileData?.name || 'File');
      return newLink;
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Failed to create share link');
      return null;
    }
  }, [user]);

  const deleteShareLink = useCallback(async (linkId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('shared_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      setSharedLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success('Share link deleted');
      return true;
    } catch (error) {
      console.error('Error deleting share link:', error);
      toast.error('Failed to delete share link');
      return false;
    }
  }, [user]);

  return {
    sharedLinks,
    loading,
    fetchSharedLinks,
    createShareLink,
    deleteShareLink
  };
};