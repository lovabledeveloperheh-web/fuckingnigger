import { useEffect, useState } from 'react';
import { Link, Copy, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSharing } from '@/hooks/useSharing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FileData {
  id: string;
  name: string;
}

export const SharedLinksPage = () => {
  const { user } = useAuth();
  const { sharedLinks, loading, fetchSharedLinks, deleteShareLink } = useSharing();
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSharedLinks();
  }, [fetchSharedLinks]);

  useEffect(() => {
    const fetchFileNames = async () => {
      if (sharedLinks.length === 0) return;

      const fileIds = sharedLinks.map(l => l.file_id);
      const { data } = await supabase
        .from('files')
        .select('id, name')
        .in('id', fileIds);

      if (data) {
        const names: Record<string, string> = {};
        data.forEach(f => { names[f.id] = f.name; });
        setFileNames(names);
      }
    };

    fetchFileNames();
  }, [sharedLinks]);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="grid gap-4">
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
          <Link className="w-6 h-6" />
          Shared Links
        </h1>
        <p className="text-muted-foreground">
          {sharedLinks.length} active share links
        </p>
      </div>

      {sharedLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Link className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No shared links</p>
          <p className="text-sm">Share files to create links</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sharedLinks.map((link, index) => {
            const expired = isExpired(link.expires_at);
            const limitReached = link.max_downloads && link.download_count >= link.max_downloads;

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-card border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {fileNames[link.file_id] || 'Unknown file'}
                    </p>
                    {link.has_password && (
                      <Badge variant="secondary">🔒 Protected</Badge>
                    )}
                    {expired && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {limitReached && (
                      <Badge variant="destructive">Limit Reached</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDate(link.created_at)}
                    {link.expires_at && ` • Expires ${formatDate(link.expires_at)}`}
                    {' • '}{link.download_count} downloads
                    {link.max_downloads && ` / ${link.max_downloads} max`}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(link.share_token)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/share/${link.share_token}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteShareLink(link.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
