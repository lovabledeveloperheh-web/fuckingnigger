import { motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';

interface StorageIndicatorProps {
  used: number;
  limit: number;
}

export const StorageIndicator = ({ used, limit }: StorageIndicatorProps) => {
  const percentage = Math.min((used / limit) * 100, 100);
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getColorClass = () => {
    if (percentage > 90) return 'bg-destructive';
    if (percentage > 70) return 'bg-warning';
    return 'gradient-brand';
  };

  return (
    <div className="p-4 bg-card rounded-xl border border-border/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <HardDrive className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-sm">Storage</h3>
          <p className="text-xs text-muted-foreground">
            {formatBytes(used)} of {formatBytes(limit)} used
          </p>
        </div>
      </div>
      
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${getColorClass()}`}
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 text-right">
        {percentage.toFixed(1)}% used
      </p>
    </div>
  );
};
