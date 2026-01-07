import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface SharedLink {
  id: string;
  file_id: string;
  password: string | null;
  expires_at: string | null;
  download_count: number;
  max_downloads: number | null;
}

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const SharedFilePage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState<SharedLink | null>(null);
  const [file, setFile] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchSharedFile = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        // Fetch share link
        const { data: linkData, error: linkError } = await supabase
          .from('shared_links')
          .select('*')
          .eq('share_token', token)
          .single();

        if (linkError || !linkData) {
          setError('Share link not found or has been deleted');
          setLoading(false);
          return;
        }

        // Check if expired
        if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
          setError('This share link has expired');
          setLoading(false);
          return;
        }

        // Check download limit
        if (linkData.max_downloads && linkData.download_count >= linkData.max_downloads) {
          setError('Download limit reached for this link');
          setLoading(false);
          return;
        }

        setLink(linkData);

        // Check if password required
        if (linkData.password) {
          setPasswordRequired(true);
          setLoading(false);
          return;
        }

        // Fetch file info
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('id', linkData.file_id)
          .single();

        if (fileError || !fileData) {
          setError('File not found');
          setLoading(false);
          return;
        }

        setFile(fileData);
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedFile();
  }, [token]);

  const verifyPassword = async () => {
    if (!link) return;

    if (password === link.password) {
      setPasswordRequired(false);
      setLoading(true);

      const { data: fileData } = await supabase
        .from('files')
        .select('*')
        .eq('id', link.file_id)
        .single();

      if (fileData) {
        setFile(fileData);
      } else {
        setError('File not found');
      }
      setLoading(false);
    } else {
      toast.error('Incorrect password');
    }
  };

  const handleDownload = async () => {
    if (!file || !link) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      // Increment download count
      await supabase
        .from('shared_links')
        .update({ download_count: link.download_count + 1 })
        .eq('id', link.id);

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-2" />
            <CardTitle>Unable to Access File</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>Enter the password to access this file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
            />
            <Button onClick={verifyPassword} className="w-full">
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <FileText className="w-12 h-12 mx-auto text-primary mb-2" />
          <CardTitle className="break-all">{file?.name}</CardTitle>
          <CardDescription>
            {file && formatSize(file.size)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDownload} 
            disabled={downloading}
            className="w-full"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            {downloading ? 'Downloading...' : 'Download File'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
