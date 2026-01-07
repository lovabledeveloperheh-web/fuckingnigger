import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTrash } from '@/hooks/useTrash';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysUntilExpiry = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const TrashPage = () => {
  const { trashItems, loading, fetchTrash, restoreFromTrash, permanentDelete, emptyTrash } = useTrash();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const totalSize = trashItems.reduce((acc, item) => acc + item.size, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Trash
          </h1>
          <p className="text-muted-foreground">
            {trashItems.length} items • {formatFileSize(totalSize)}
          </p>
        </div>
        
        {trashItems.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {trashItems.length} items. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={emptyTrash}>
                  Empty Trash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Items in trash will be automatically deleted after 30 days
          </p>
        </CardContent>
      </Card>

      {/* Trash Items */}
      {trashItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Trash2 className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Trash is empty</p>
          <p className="text-sm">Deleted files will appear here</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {trashItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg bg-card border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(item.size)} • Deleted {formatDate(item.deleted_at)}
                  <span className="text-amber-500 ml-2">
                    • Expires in {daysUntilExpiry(item.expires_at)} days
                  </span>
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreFromTrash(item)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete Forever
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Forever?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{item.name}" will be permanently deleted. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => permanentDelete(item)}>
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
