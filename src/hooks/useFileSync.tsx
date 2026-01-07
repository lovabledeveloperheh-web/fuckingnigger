import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SyncState {
  isSyncing: boolean;
  progress: number;
  totalFiles: number;
  syncedFiles: number;
  lastSyncAt: Date | null;
}

export const useFileSync = () => {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    progress: 100,
    totalFiles: 0,
    syncedFiles: 0,
    lastSyncAt: null,
  });

  // Initialize sync status record
  useEffect(() => {
    if (user) {
      initSyncStatus();
    }
  }, [user]);

  const initSyncStatus = async () => {
    if (!user) return;
    
    try {
      const { data: existing } = await supabase
        .from('sync_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('sync_status').insert({
          user_id: user.id,
          is_syncing: false,
          total_files: 0,
          synced_files: 0,
        });
      } else {
        setSyncState({
          isSyncing: existing.is_syncing,
          progress: existing.total_files > 0 ? (existing.synced_files / existing.total_files) * 100 : 100,
          totalFiles: existing.total_files,
          syncedFiles: existing.synced_files,
          lastSyncAt: existing.last_sync_at ? new Date(existing.last_sync_at) : null,
        });
      }
    } catch (error) {
      console.error('Error initializing sync status:', error);
    }
  };

  const updateSyncProgress = async (syncedFiles: number, totalFiles: number, isSyncing: boolean) => {
    if (!user) return;

    const progress = totalFiles > 0 ? (syncedFiles / totalFiles) * 100 : 100;
    
    setSyncState({
      isSyncing,
      progress,
      totalFiles,
      syncedFiles,
      lastSyncAt: !isSyncing ? new Date() : syncState.lastSyncAt,
    });

    try {
      await supabase
        .from('sync_status')
        .update({
          is_syncing: isSyncing,
          total_files: totalFiles,
          synced_files: syncedFiles,
          last_sync_at: !isSyncing ? new Date().toISOString() : undefined,
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  };

  const syncFiles = useCallback(async (files: File[], folderPath: string = '/') => {
    if (!user || files.length === 0) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, totalFiles: files.length, syncedFiles: 0, progress: 0 }));
    await updateSyncProgress(0, files.length, true);

    const results: { success: boolean; fileName: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Preserve original filename exactly
        const fileId = crypto.randomUUID();
        const storagePath = `${user.id}/${folderPath === '/' ? '' : folderPath}${fileId}-${file.name}`;

        // Check if file already exists with same name and size
        const { data: existingFile } = await supabase
          .from('files')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', file.name)
          .eq('size', file.size)
          .eq('folder_path', folderPath)
          .maybeSingle();

        if (existingFile) {
          // Skip duplicate files
          results.push({ success: true, fileName: file.name });
          await updateSyncProgress(i + 1, files.length, true);
          continue;
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // Create file record - preserving exact filename
        const { error: dbError } = await supabase.from('files').insert({
          user_id: user.id,
          name: file.name, // Exact original filename preserved
          size: file.size,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          folder_path: folderPath,
        });

        if (dbError) throw dbError;

        results.push({ success: true, fileName: file.name });
      } catch (error) {
        console.error(`Error syncing ${file.name}:`, error);
        results.push({ success: false, fileName: file.name });
      }

      await updateSyncProgress(i + 1, files.length, true);
    }

    // Finish sync
    await updateSyncProgress(files.length, files.length, false);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      toast.success(`Synced ${successCount} file${successCount !== 1 ? 's' : ''} successfully!`);
    } else {
      toast.warning(`Synced ${successCount} files, ${failCount} failed`);
    }

    return results;
  }, [user]);

  // Sync folder with all its contents preserving structure
  const syncFolder = useCallback(async (folderEntry: FileSystemDirectoryEntry, basePath: string = '/') => {
    if (!user) return;

    const getAllFilesFromFolder = async (dirEntry: FileSystemDirectoryEntry, path: string): Promise<{ file: File; folderPath: string }[]> => {
      const files: { file: File; folderPath: string }[] = [];
      const reader = dirEntry.createReader();
      
      const readEntries = (): Promise<FileSystemEntry[]> => {
        return new Promise((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
      };

      const entries = await readEntries();
      
      for (const entry of entries) {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          const file = await new Promise<File>((resolve, reject) => {
            fileEntry.file(resolve, reject);
          });
          files.push({ file, folderPath: path });
        } else if (entry.isDirectory) {
          const subDirEntry = entry as FileSystemDirectoryEntry;
          const subPath = `${path}${entry.name}/`;
          const subFiles = await getAllFilesFromFolder(subDirEntry, subPath);
          files.push(...subFiles);
        }
      }

      return files;
    };

    try {
      const folderPath = `${basePath}${folderEntry.name}/`;
      const allFiles = await getAllFilesFromFolder(folderEntry, folderPath);
      
      if (allFiles.length === 0) {
        toast.info('No files found in folder');
        return;
      }

      setSyncState(prev => ({ ...prev, isSyncing: true, totalFiles: allFiles.length, syncedFiles: 0, progress: 0 }));
      await updateSyncProgress(0, allFiles.length, true);

      for (let i = 0; i < allFiles.length; i++) {
        const { file, folderPath } = allFiles[i];
        
        try {
          const fileId = crypto.randomUUID();
          const storagePath = `${user.id}/${folderPath.slice(1)}${fileId}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('user-files')
            .upload(storagePath, file);

          if (uploadError) throw uploadError;

          await supabase.from('files').insert({
            user_id: user.id,
            name: file.name,
            size: file.size,
            mime_type: file.type || 'application/octet-stream',
            storage_path: storagePath,
            folder_path: folderPath,
          });
        } catch (error) {
          console.error(`Error syncing ${file.name}:`, error);
        }

        await updateSyncProgress(i + 1, allFiles.length, true);
      }

      await updateSyncProgress(allFiles.length, allFiles.length, false);
      toast.success(`Folder "${folderEntry.name}" synced with ${allFiles.length} files!`);
    } catch (error) {
      console.error('Folder sync error:', error);
      toast.error('Failed to sync folder');
      await updateSyncProgress(0, 0, false);
    }
  }, [user]);

  return {
    syncState,
    syncFiles,
    syncFolder,
    updateSyncProgress,
  };
};
