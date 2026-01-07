import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface TrashItem {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
  original_folder_path: string | null;
  deleted_at: string;
  expires_at: string;
  original_file_id: string | null;
}

export const useTrash = () => {
  const { user } = useAuth();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrash = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trash')
        .select('*')
        .eq('user_id', user.id)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setTrashItems(data || []);
    } catch (error) {
      console.error('Error fetching trash:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const moveToTrash = useCallback(async (file: {
    id: string;
    name: string;
    size: number;
    mime_type: string | null;
    storage_path: string;
    folder_path?: string | null;
  }) => {
    if (!user) return false;
    
    try {
      // Insert into trash
      const { error: trashError } = await supabase
        .from('trash')
        .insert({
          user_id: user.id,
          original_file_id: file.id,
          name: file.name,
          size: file.size,
          mime_type: file.mime_type,
          storage_path: file.storage_path,
          original_folder_path: file.folder_path || '/'
        });

      if (trashError) throw trashError;

      // Mark file as deleted (soft delete)
      const { error: updateError } = await supabase
        .from('files')
        .update({ is_deleted: true })
        .eq('id', file.id);

      if (updateError) throw updateError;

      toast.success('Moved to trash');
      return true;
    } catch (error) {
      console.error('Error moving to trash:', error);
      toast.error('Failed to move to trash');
      return false;
    }
  }, [user]);

  const restoreFromTrash = useCallback(async (trashItem: TrashItem) => {
    if (!user) return false;
    
    try {
      // Restore the file
      if (trashItem.original_file_id) {
        const { error: updateError } = await supabase
          .from('files')
          .update({ is_deleted: false })
          .eq('id', trashItem.original_file_id);

        if (updateError) throw updateError;
      }

      // Remove from trash
      const { error: deleteError } = await supabase
        .from('trash')
        .delete()
        .eq('id', trashItem.id);

      if (deleteError) throw deleteError;

      toast.success('File restored');
      await fetchTrash();
      return true;
    } catch (error) {
      console.error('Error restoring file:', error);
      toast.error('Failed to restore file');
      return false;
    }
  }, [user, fetchTrash]);

  const permanentDelete = useCallback(async (trashItem: TrashItem) => {
    if (!user) return false;
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([trashItem.storage_path]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Delete from files table if exists
      if (trashItem.original_file_id) {
        await supabase
          .from('files')
          .delete()
          .eq('id', trashItem.original_file_id);
      }

      // Delete from trash
      const { error: deleteError } = await supabase
        .from('trash')
        .delete()
        .eq('id', trashItem.id);

      if (deleteError) throw deleteError;

      toast.success('Permanently deleted');
      await fetchTrash();
      return true;
    } catch (error) {
      console.error('Error permanently deleting:', error);
      toast.error('Failed to delete permanently');
      return false;
    }
  }, [user, fetchTrash]);

  const emptyTrash = useCallback(async () => {
    if (!user) return false;
    
    try {
      // Get all trash items
      const { data: items } = await supabase
        .from('trash')
        .select('storage_path, original_file_id')
        .eq('user_id', user.id);

      if (items && items.length > 0) {
        // Delete from storage
        const paths = items.map(i => i.storage_path);
        await supabase.storage.from('user-files').remove(paths);

        // Delete from files table
        const fileIds = items.filter(i => i.original_file_id).map(i => i.original_file_id);
        if (fileIds.length > 0) {
          await supabase
            .from('files')
            .delete()
            .in('id', fileIds);
        }
      }

      // Empty trash
      const { error } = await supabase
        .from('trash')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Trash emptied');
      setTrashItems([]);
      return true;
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
      return false;
    }
  }, [user]);

  return {
    trashItems,
    loading,
    fetchTrash,
    moveToTrash,
    restoreFromTrash,
    permanentDelete,
    emptyTrash
  };
};
