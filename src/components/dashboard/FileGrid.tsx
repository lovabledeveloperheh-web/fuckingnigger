import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Grid3X3, List, FileX, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileCard } from './FileCard';
import { FilePreviewModal } from './FilePreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface File {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  created_at: string;
  storage_path: string;
  folder_path: string;
}

interface FileGridProps {
  files: File[];
  loading: boolean;
  searchQuery: string;
  onRefresh: () => void;
}

export const FileGrid = ({ files, loading, searchQuery, onRefresh }: FileGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteFile, setDeleteFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [currentFolder, setCurrentFolder] = useState('/');

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    file.folder_path === currentFolder
  );

  // Get unique folders in current path
  const subFolders = [...new Set(
    files
      .filter(f => f.folder_path.startsWith(currentFolder) && f.folder_path !== currentFolder)
      .map(f => {
        const remainingPath = f.folder_path.slice(currentFolder.length);
        const nextFolder = remainingPath.split('/')[0];
        return nextFolder;
      })
      .filter(Boolean)
  )];

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name; // Use original filename
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Downloading ${file.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([deleteFile.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', deleteFile.id);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeleteFile(null);
    }
  };

  const navigateToFolder = (folderName: string) => {
    setCurrentFolder(`${currentFolder}${folderName}/`);
  };

  const navigateUp = () => {
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    setCurrentFolder(parts.length > 0 ? `/${parts.join('/')}/` : '/');
  };

  // Get previewable files for navigation in modal
  const previewableFiles = filteredFiles.filter(f => 
    f.mime_type?.startsWith('image/') || 
    f.mime_type?.startsWith('video/') || 
    f.mime_type?.startsWith('audio/') ||
    f.mime_type === 'application/pdf' ||
    f.mime_type?.startsWith('text/')
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="file-card animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary" />
              <div className="flex-1">
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      {currentFolder !== '/' && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Button variant="ghost" size="sm" onClick={() => setCurrentFolder('/')}>
            <Folder className="w-4 h-4 mr-1" />
            Root
          </Button>
          {currentFolder.split('/').filter(Boolean).map((part, index, arr) => (
            <span key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentFolder(`/${arr.slice(0, index + 1).join('/')}/`)}
              >
                {part}
              </Button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Folder className="w-4 h-4" />
          <span>{filteredFiles.length} files, {subFolders.length} folders</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredFiles.length === 0 && subFolders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <FileX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">
            {searchQuery ? 'No files found' : 'No files yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Upload your first file to get started'}
          </p>
        </motion.div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
        }>
          {/* Back button if in subfolder */}
          {currentFolder !== '/' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="file-card"
              onClick={navigateUp}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">..</p>
                  <p className="text-xs text-muted-foreground">Go back</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Subfolders */}
          <AnimatePresence mode="popLayout">
            {subFolders.map((folder, index) => (
              <motion.div
                key={`folder-${folder}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="file-card"
                onClick={() => navigateToFolder(folder)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Folder className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{folder}</p>
                    <p className="text-xs text-muted-foreground">Folder</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Files */}
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file, index) => (
              <FileCard
                key={file.id}
                file={file}
                index={index + subFolders.length}
                onDownload={handleDownload}
                onDelete={() => setDeleteFile(file)}
                onPreview={() => setPreviewFile(file)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        files={previewableFiles}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />
    </>
  );
};
