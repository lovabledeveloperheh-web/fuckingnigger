import { useState } from 'react';
import { Copy, Link, Lock, Calendar, Hash, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    name: string;
  } | null;
  onCreateLink: (fileId: string, options?: {
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
  }) => Promise<any>;
}

export const ShareDialog = ({ open, onOpenChange, file, onCreateLink }: ShareDialogProps) => {
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [useDownloadLimit, setUseDownloadLimit] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState(10);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateLink = async () => {
    if (!file) return;
    
    setLoading(true);
    const options: any = {};
    
    if (usePassword && password) {
      options.password = password;
    }
    if (useExpiry) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiryDays);
      options.expiresAt = expiry;
    }
    if (useDownloadLimit) {
      options.maxDownloads = maxDownloads;
    }

    const result = await onCreateLink(file.id, options);
    setLoading(false);
    
    if (result) {
      const shareUrl = `${window.location.origin}/share/${result.share_token}`;
      setCreatedLink(shareUrl);
    }
  };

  const copyToClipboard = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      toast.success('Link copied to clipboard');
    }
  };

  const handleClose = () => {
    setCreatedLink(null);
    setUsePassword(false);
    setPassword('');
    setUseExpiry(false);
    setUseDownloadLimit(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Share {file?.name}
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for this file
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={createdLink} readOnly className="flex-1" />
              <Button size="icon" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Anyone with this link can download the file
              {usePassword && ' (password protected)'}
              {useExpiry && ` • Expires in ${expiryDays} days`}
              {useDownloadLimit && ` • Max ${maxDownloads} downloads`}
            </p>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Password Protection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <Label>Password protect</Label>
              </div>
              <Switch checked={usePassword} onCheckedChange={setUsePassword} />
            </div>
            {usePassword && (
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {/* Expiry */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label>Set expiration</Label>
              </div>
              <Switch checked={useExpiry} onCheckedChange={setUseExpiry} />
            </div>
            {useExpiry && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}

            {/* Download Limit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <Label>Limit downloads</Label>
              </div>
              <Switch checked={useDownloadLimit} onCheckedChange={setUseDownloadLimit} />
            </div>
            {useDownloadLimit && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 10)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">downloads</span>
              </div>
            )}

            <Button onClick={handleCreateLink} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Link'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
