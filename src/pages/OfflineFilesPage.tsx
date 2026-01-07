import { useEffect, useState } from 'react';
import { CloudOff, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';
import { FileCard } from '@/components/dashboard/FileCard';
import { Button } from '@/components/ui/button';
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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const OfflineFilesPage = () => {
  const { user } = useAuth();
  const { offlineFiles, loading: offlineLoading, fetchOfflineFiles, removeFromOffline, clearOfflineCache, getOfflineCacheSize } = useOffline();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfflineFiles();
  }, [fetchOfflineFiles]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!user || offlineFiles.length === 0) {
        setFiles([]);
        setLoading(false);
        return;
      }

      try {
        const fileIds = offlineFiles.map(f => f.file_id);
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .in('id', fileIds);

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching offline files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [user, offlineFiles]);

  const handleRemove = async (file: FileData) => {
    await removeFromOffline(file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
  };

  const handleClearCache = async () => {
    await clearOfflineCache();
    setFiles([]);
  };

  const cacheSize = getOfflineCacheSize();

  if (loading || offlineLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudOff className="w-6 h-6" />
            Offline Files
          </h1>
          <p className="text-muted-foreground">
            {files.length} files • {formatFileSize(cacheSize)} cached
          </p>
        </div>
        
        {files.length > 0 && (
          <Button variant="outline" onClick={handleClearCache}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CloudOff className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No offline files</p>
          <p className="text-sm">Mark files as available offline to access them without internet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <FileCard
              key={file.id}
              file={file}
              index={index}
              onDownload={() => {}}
              onDelete={() => handleRemove(file)}
              onPreview={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};
