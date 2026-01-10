import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Download, X, CheckCircle, AlertCircle, 
  ChevronDown, ChevronUp, Clock, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadManager } from '@/hooks/useUploadManager';
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { cn } from '@/lib/utils';

const formatEta = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const TransferManager = () => {
  const { 
    uploads, 
    isMinimized: uploadsMinimized, 
    toggleMinimized: toggleUploads,
    removeUpload,
    clearCompleted: clearCompletedUploads
  } = useUploadManager();
  
  const { 
    downloads, 
    isMinimized: downloadsMinimized, 
    toggleMinimized: toggleDownloads,
    removeDownload,
    clearCompleted: clearCompletedDownloads
  } = useDownloadManager();

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending');
  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'pending');
  const completedUploads = uploads.filter(u => u.status === 'complete');
  const completedDownloads = downloads.filter(d => d.status === 'complete');
  const errorUploads = uploads.filter(u => u.status === 'error');
  const errorDownloads = downloads.filter(d => d.status === 'error');

  const hasUploads = uploads.length > 0;
  const hasDownloads = downloads.length > 0;

  if (!hasUploads && !hasDownloads) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {/* Uploads Panel */}
      <AnimatePresence>
        {hasUploads && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-3 bg-primary/5 cursor-pointer"
              onClick={toggleUploads}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">
                  Uploads ({activeUploads.length} active)
                </span>
              </div>
              <div className="flex items-center gap-1">
                {completedUploads.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={(e) => { e.stopPropagation(); clearCompletedUploads(); }}
                  >
                    Clear
                  </Button>
                )}
                {uploadsMinimized ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!uploadsMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
                    {uploads.map((upload) => (
                      <div 
                        key={upload.id}
                        className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{upload.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatSize(upload.bytesUploaded)} / {formatSize(upload.fileSize)}</span>
                            {upload.status === 'uploading' && upload.eta !== undefined && (
                              <>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>{formatEta(upload.eta)}</span>
                              </>
                            )}
                          </div>
                          <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${upload.progress}%` }}
                              className={cn(
                                "h-full rounded-full",
                                upload.status === 'error' ? 'bg-destructive' : 'bg-primary'
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {upload.status === 'uploading' && (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          )}
                          {upload.status === 'complete' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {upload.status === 'error' && (
                            <button onClick={() => removeUpload(upload.id)}>
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Downloads Panel */}
      <AnimatePresence>
        {hasDownloads && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-3 bg-primary/5 cursor-pointer"
              onClick={toggleDownloads}
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">
                  Downloads ({activeDownloads.length} active)
                </span>
              </div>
              <div className="flex items-center gap-1">
                {completedDownloads.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={(e) => { e.stopPropagation(); clearCompletedDownloads(); }}
                  >
                    Clear
                  </Button>
                )}
                {downloadsMinimized ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!downloadsMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
                    {downloads.map((download) => (
                      <div 
                        key={download.id}
                        className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{download.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatSize(download.bytesDownloaded)} / {formatSize(download.fileSize)}</span>
                            {download.status === 'downloading' && (
                              <>
                                {download.speed && (
                                  <>
                                    <span>•</span>
                                    <span>{formatSpeed(download.speed)}</span>
                                  </>
                                )}
                                {download.eta !== undefined && (
                                  <>
                                    <span>•</span>
                                    <Clock className="w-3 h-3" />
                                    <span>{formatEta(download.eta)}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${download.progress}%` }}
                              className={cn(
                                "h-full rounded-full",
                                download.status === 'error' ? 'bg-destructive' : 'bg-primary'
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {download.status === 'downloading' && (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          )}
                          {download.status === 'complete' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {download.status === 'error' && (
                            <button onClick={() => removeDownload(download.id)}>
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
