import { useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { FileCard } from '@/components/dashboard/FileCard';
import { FilePreviewModal } from '@/components/dashboard/FilePreviewModal';
import { toast } from 'sonner';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
  created_at: string;
  folder_path: string | null;
}

export const FavoritesPage = () => {
  const { user } = useAuth();
  const { favorites, loading: favoritesLoading, fetchFavorites, toggleFavorite } = useFavorites();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    const fetchFavoriteFiles = async () => {
      if (!user || favorites.length === 0) {
        setFiles([]);
        setLoading(false);
        return;
      }

      try {
        const fileIds = favorites.map(f => f.file_id);
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .in('id', fileIds)
          .eq('is_deleted', false);

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching favorite files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteFiles();
  }, [user, favorites]);

  const handleDownload = async (file: FileData) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (file: FileData) => {
    await toggleFavorite(file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
  };

  if (loading || favoritesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          Favorites
        </h1>
        <p className="text-muted-foreground">
          {files.length} favorite files
        </p>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Star className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm">Star files to add them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <FileCard
              key={file.id}
              file={file}
              index={index}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onPreview={setPreviewFile}
            />
          ))}
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          files={files}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
