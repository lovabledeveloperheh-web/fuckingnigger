import { motion } from 'framer-motion';
import { 
  FileText, Image, Video, Music, Archive, File, 
  MoreVertical, Download, Trash2, Eye 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { StarButton } from './StarButton';

interface FileCardProps {
  file: {
    id: string;
    name: string;
    size: number;
    mime_type: string | null;
    created_at: string;
    storage_path: string;
  };
  onDownload: (file: any) => void;
  onDelete: (file: any) => void;
  onPreview: (file: any) => void;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (fileId: string) => void;
}

export const FileCard = ({ file, onDownload, onDelete, onPreview, index, isFavorite = false, onToggleFavorite }: FileCardProps) => {
  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
    return File;
  };

  const getIconColor = (mimeType: string | null) => {
    if (!mimeType) return 'text-muted-foreground';
    if (mimeType.startsWith('image/')) return 'text-pink-500';
    if (mimeType.startsWith('video/')) return 'text-purple-500';
    if (mimeType.startsWith('audio/')) return 'text-green-500';
    if (mimeType.includes('pdf')) return 'text-red-500';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'text-amber-500';
    return 'text-primary';
  };

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

  const Icon = getFileIcon(file.mime_type);
  const iconColor = getIconColor(file.mime_type);

  const isPreviewable = file.mime_type?.startsWith('image/') || file.mime_type === 'application/pdf';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="file-card group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate mb-1" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} • {formatDate(file.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <StarButton
              isFavorite={isFavorite}
              onToggle={() => onToggleFavorite(file.id)}
            />
          )}

          {/* Always visible Download button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-secondary"
            onClick={() => onDownload(file)}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-1.5">
              {isPreviewable && (
                <DropdownMenuItem onClick={() => onPreview(file)} className="rounded-lg">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDownload(file)} className="rounded-lg">
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(file)} className="text-destructive rounded-lg">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};
