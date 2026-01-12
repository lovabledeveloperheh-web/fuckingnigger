import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
}

interface LinkInfo {
  link_id: string;
  download_count: number;
  max_downloads: number | null;
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
  const [file, setFile] = useState<FileData | null>(null);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const fetchSharedFile = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        // Use server-side verification function (no password initially)
        const { data, error: verifyError } = await supabase.rpc('verify_shared_link_access', {
          p_share_token: token,
          p_password: null
        });

        if (verifyError) {
          console.error('Verification error:', verifyError);
          setError('An error occurred while verifying the link');
          setLoading(false);
          return;
        }

        const result = data?.[0];

        if (!result) {
          setError('Share link not found or has been deleted');
          setLoading(false);
          return;
        }

        if (result.rate_limited) {
          setRateLimited(true);
          setError('Too many failed attempts. Please try again later.');
          setLoading(false);
          return;
        }

        if (result.requires_password && !result.valid) {
          // Password required but not provided
          setPasswordRequired(true);
          setLoading(false);
          return;
        }

        if (!result.valid) {
          setError('Share link not found, expired, or download limit reached');
          setLoading(false);
          return;
        }

        // Success - set file and link info
        setFile({
          id: result.file_id,
          name: result.file_name,
          size: result.file_size,
          mime_type: result.file_mime_type,
          storage_path: result.file_storage_path
        });
        setLinkInfo({
          link_id: result.link_id,
          download_count: result.download_count,
          max_downloads: result.max_downloads
        });
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
    if (!token || !password) return;

    setLoading(true);
    try {
      // Server-side password verification with rate limiting
      const { data, error: verifyError } = await supabase.rpc('verify_shared_link_access', {
        p_share_token: token,
        p_password: password
      });

      if (verifyError) {
        console.error('Verification error:', verifyError);
        toast.error('Verification failed');
        setLoading(false);
        return;
      }

      const result = data?.[0];

      if (!result) {
        toast.error('Verification failed');
        setLoading(false);
        return;
      }

      if (result.rate_limited) {
        setRateLimited(true);
        setPasswordRequired(false);
        setError('Too many failed attempts. Please try again later.');
        setLoading(false);
        return;
      }

      if (!result.valid) {
        toast.error('Incorrect password');
        setPassword('');
        setLoading(false);
        return;
      }

      // Success - password verified server-side
      setPasswordRequired(false);
      setFile({
        id: result.file_id,
        name: result.file_name,
        size: result.file_size,
        mime_type: result.file_mime_type,
        storage_path: result.file_storage_path
      });
      setLinkInfo({
        link_id: result.link_id,
        download_count: result.download_count,
        max_downloads: result.max_downloads
      });
    } catch (err) {
      console.error('Error:', err);
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !linkInfo) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      // Increment download count server-side
      await supabase.rpc('increment_shared_link_download', {
        p_link_id: linkInfo.link_id
      });

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
            {rateLimited && (
              <CardDescription className="mt-2 text-sm">
                Please wait at least an hour before trying again.
              </CardDescription>
            )}
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