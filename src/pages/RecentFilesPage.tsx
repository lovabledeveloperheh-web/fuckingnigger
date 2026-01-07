import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRecentFiles } from '@/hooks/useRecentFiles';
import { FileCard } from '@/components/dashboard/FileCard';
import { FilePreviewModal } from '@/components/dashboard/FilePreviewModal';
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

export const RecentFilesPage = () => {
  const { user } = useAuth();
  const { recentFiles, loading: recentLoading, fetchRecentFiles, clearRecentFiles } = useRecentFiles();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!user || recentFiles.length === 0) {
        setFiles([]);
        setLoading(false);
        return;
      }

      try {
        const fileIds = recentFiles.map(f => f.file_id);
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .in('id', fileIds)
          .eq('is_deleted', false);

        if (error) throw error;

        // Sort by recent access
        const orderedFiles = fileIds
          .map(id => data?.find(f => f.id === id))
          .filter(Boolean) as FileData[];

        setFiles(orderedFiles);
      } catch (error) {
        console.error('Error fetching recent files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [user, recentFiles]);

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

  const handleClearHistory = async () => {
    await clearRecentFiles();
    setFiles([]);
    toast.success('Recent files cleared');
  };

  if (loading || recentLoading) {
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
            <Clock className="w-6 h-6" />
            Recent Files
          </h1>
          <p className="text-muted-foreground">
            {files.length} recently accessed files
          </p>
        </div>
        
        {files.length > 0 && (
          <Button variant="outline" onClick={handleClearHistory}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Clock className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No recent files</p>
          <p className="text-sm">Files you view will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <FileCard
              key={file.id}
              file={file}
              index={index}
              onDownload={handleDownload}
              onDelete={() => {}}
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
