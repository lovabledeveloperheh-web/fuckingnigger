import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SharedLink {
  id: string;
  file_id: string;
  share_token: string;
  password: string | null;
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
      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedLinks(data || []);
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
      
      const { data, error } = await supabase
        .from('shared_links')
        .insert({
          user_id: user.id,
          file_id: fileId,
          share_token: shareToken,
          password: options?.password || null,
          expires_at: options?.expiresAt?.toISOString() || null,
          max_downloads: options?.maxDownloads || null
        })
        .select()
        .single();

      if (error) throw error;
      
      setSharedLinks(prev => [data, ...prev]);
      toast.success('Share link created');
      return data;
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

  const getShareLinkByToken = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .eq('share_token', token)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching share link:', error);
      return null;
    }
  }, []);

  const incrementDownloadCount = useCallback(async (linkId: string) => {
    try {
      const { data: current } = await supabase
        .from('shared_links')
        .select('download_count')
        .eq('id', linkId)
        .single();
      
      if (current) {
        await supabase
          .from('shared_links')
          .update({ download_count: current.download_count + 1 })
          .eq('id', linkId);
      }
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }, []);

  return {
    sharedLinks,
    loading,
    fetchSharedLinks,
    createShareLink,
    deleteShareLink,
    getShareLinkByToken,
    incrementDownloadCount
  };
};
