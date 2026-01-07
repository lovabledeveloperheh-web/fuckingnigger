import { useMemo } from 'react';
import { FileText, Image, Video, Music, Archive, File } from 'lucide-react';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
}

interface LargestFilesProps {
  files: FileData[];
  onFileClick?: (file: FileData) => void;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  return File;
};

export const LargestFiles = ({ files, onFileClick }: LargestFilesProps) => {
  const largestFiles = useMemo(() => 
    [...files].sort((a, b) => b.size - a.size).slice(0, 10),
    [files]
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Largest Files</h3>
      <div className="space-y-2">
        {largestFiles.map((file, index) => {
          const Icon = getFileIcon(file.mime_type);
          
          return (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
              onClick={() => onFileClick?.(file)}
            >
              <span className="text-sm font-medium text-muted-foreground w-6">
                {index + 1}
              </span>
              <div className="w-8 h-8 rounded bg-background flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
              </div>
              <span className="text-sm font-medium">{formatSize(file.size)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
