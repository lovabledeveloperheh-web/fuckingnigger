import { useEffect, useState } from 'react';
import { Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GalleryView } from '@/components/gallery/GalleryView';
import { toast } from 'sonner';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
  created_at: string;
}

export const GalleryPage = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMediaFiles = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter for media files
        const mediaFiles = (data || []).filter(f => 
          f.mime_type?.startsWith('image/') || 
          f.mime_type?.startsWith('video/')
        );

        setFiles(mediaFiles);
      } catch (error) {
        console.error('Error fetching media files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaFiles();
  }, [user]);

  const getSignedUrl = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-square bg-secondary rounded-lg" />
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
          <Image className="w-6 h-6" />
          Gallery
        </h1>
        <p className="text-muted-foreground">
          {files.length} photos and videos
        </p>
      </div>

      <GalleryView 
        files={files}
        onGetSignedUrl={getSignedUrl}
        onDownload={handleDownload}
      />
    </div>
  );
};
