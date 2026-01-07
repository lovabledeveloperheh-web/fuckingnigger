import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RecentFile {
  id: string;
  file_id: string;
  accessed_at: string;
}

export const useRecentFiles = () => {
  const { user } = useAuth();
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recent_files')
        .select('*')
        .eq('user_id', user.id)
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecentFiles(data || []);
    } catch (error) {
      console.error('Error fetching recent files:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const trackFileAccess = useCallback(async (fileId: string) => {
    if (!user) return;
    
    try {
      // Upsert to update accessed_at if exists, or insert new
      const { error } = await supabase
        .from('recent_files')
        .upsert(
          { user_id: user.id, file_id: fileId, accessed_at: new Date().toISOString() },
          { onConflict: 'user_id,file_id' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking file access:', error);
    }
  }, [user]);

  const clearRecentFiles = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('recent_files')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setRecentFiles([]);
    } catch (error) {
      console.error('Error clearing recent files:', error);
    }
  }, [user]);

  return {
    recentFiles,
    loading,
    fetchRecentFiles,
    trackFileAccess,
    clearRecentFiles
  };
};
