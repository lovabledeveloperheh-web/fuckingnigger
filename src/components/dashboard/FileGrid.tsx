import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Grid3X3, List, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileCard } from './FileCard';
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
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Download started!');
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

  const handlePreview = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(file.storage_path, 3600);

      if (error) throw error;

      setPreviewUrl(data.signedUrl);
      setPreviewFile(file);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview file');
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Folder className="w-4 h-4" />
          <span>{filteredFiles.length} files</span>
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

      {filteredFiles.length === 0 ? (
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
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file, index) => (
              <FileCard
                key={file.id}
                file={file}
                index={index}
                onDownload={handleDownload}
                onDelete={() => setDeleteFile(file)}
                onPreview={handlePreview}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-medium truncate">{previewFile?.name}</h3>
          </div>
          <div className="p-4 flex items-center justify-center min-h-[400px] bg-secondary/20">
            {previewUrl && previewFile?.mime_type?.startsWith('image/') && (
              <img
                src={previewUrl}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
            {previewUrl && previewFile?.mime_type === 'application/pdf' && (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh]"
                title={previewFile.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
