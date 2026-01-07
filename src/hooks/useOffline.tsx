import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface OfflineFile {
  id: string;
  file_id: string;
  cached_at: string;
  cache_size: number;
}

const CACHE_NAME = 'cloudvault-offline-v1';

export const useOffline = () => {
  const { user } = useAuth();
  const [offlineFiles, setOfflineFiles] = useState<OfflineFile[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchOfflineFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offline_files')
        .select('*')
        .eq('user_id', user.id)
        .order('cached_at', { ascending: false });

      if (error) throw error;
      setOfflineFiles(data || []);
    } catch (error) {
      console.error('Error fetching offline files:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isFileOffline = useCallback((fileId: string) => {
    return offlineFiles.some(f => f.file_id === fileId);
  }, [offlineFiles]);

  const cacheFileForOffline = useCallback(async (file: {
    id: string;
    storage_path: string;
    size: number;
  }) => {
    if (!user) return false;
    
    try {
      // Get signed URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('user-files')
        .createSignedUrl(file.storage_path, 3600);

      if (urlError) throw urlError;

      // Cache the file using Cache API
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(urlData.signedUrl);
      await cache.put(`/offline/${file.id}`, response);

      // Track in database
      const { data, error } = await supabase
        .from('offline_files')
        .insert({
          user_id: user.id,
          file_id: file.id,
          cache_size: file.size
        })
        .select()
        .single();

      if (error) throw error;
      
      setOfflineFiles(prev => [data, ...prev]);
      toast.success('Available offline');
      return true;
    } catch (error) {
      console.error('Error caching file:', error);
      toast.error('Failed to cache file');
      return false;
    }
  }, [user]);

  const removeFromOffline = useCallback(async (fileId: string) => {
    if (!user) return false;
    
    try {
      // Remove from cache
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`/offline/${fileId}`);

      // Remove from database
      const { error } = await supabase
        .from('offline_files')
        .delete()
        .eq('user_id', user.id)
        .eq('file_id', fileId);

      if (error) throw error;
      
      setOfflineFiles(prev => prev.filter(f => f.file_id !== fileId));
      toast.success('Removed from offline');
      return true;
    } catch (error) {
      console.error('Error removing offline file:', error);
      toast.error('Failed to remove from offline');
      return false;
    }
  }, [user]);

  const getOfflineCacheSize = useCallback(() => {
    return offlineFiles.reduce((acc, f) => acc + f.cache_size, 0);
  }, [offlineFiles]);

  const clearOfflineCache = useCallback(async () => {
    if (!user) return false;
    
    try {
      await caches.delete(CACHE_NAME);
      
      const { error } = await supabase
        .from('offline_files')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setOfflineFiles([]);
      toast.success('Offline cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
      return false;
    }
  }, [user]);

  return {
    offlineFiles,
    isOnline,
    loading,
    fetchOfflineFiles,
    isFileOffline,
    cacheFileForOffline,
    removeFromOffline,
    getOfflineCacheSize,
    clearOfflineCache
  };
};
