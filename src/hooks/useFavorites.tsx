import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  file_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isFavorite = useCallback((fileId: string) => {
    return favorites.some(f => f.file_id === fileId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (fileId: string) => {
    if (!user) return false;
    
    const isCurrentlyFavorite = isFavorite(fileId);
    
    try {
      if (isCurrentlyFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('file_id', fileId);

        if (error) throw error;
        setFavorites(prev => prev.filter(f => f.file_id !== fileId));
        toast.success('Removed from favorites');
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, file_id: fileId })
          .select()
          .single();

        if (error) throw error;
        setFavorites(prev => [data, ...prev]);
        toast.success('Added to favorites');
      }
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
      return false;
    }
  }, [user, isFavorite]);

  return {
    favorites,
    loading,
    fetchFavorites,
    isFavorite,
    toggleFavorite
  };
};
