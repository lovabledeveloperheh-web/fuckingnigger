import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

interface FileData {
  mime_type: string | null;
  size: number;
  name: string;
}

interface FileTypeBreakdownProps {
  files: FileData[];
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileTypeBreakdown = ({ files }: FileTypeBreakdownProps) => {
  const breakdown = useMemo(() => {
    const types: Record<string, { count: number; size: number }> = {};
    
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      if (!types[ext]) {
        types[ext] = { count: 0, size: 0 };
      }
      types[ext].count++;
      types[ext].size += file.size;
    });

    return Object.entries(types)
      .map(([ext, data]) => ({ ext, ...data }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
  }, [files]);

  const maxSize = breakdown[0]?.size || 1;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">File Types</h3>
      <div className="space-y-3">
        {breakdown.map(({ ext, count, size }) => (
          <div key={ext} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium uppercase">.{ext}</span>
              <span className="text-muted-foreground">
                {count} files • {formatSize(size)}
              </span>
            </div>
            <Progress value={(size / maxSize) * 100} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};
