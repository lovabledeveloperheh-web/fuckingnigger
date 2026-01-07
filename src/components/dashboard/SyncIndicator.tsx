import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, Cloud } from 'lucide-react';

interface SyncIndicatorProps {
  isSyncing: boolean;
  progress: number;
  totalFiles: number;
  syncedFiles: number;
}

export const SyncIndicator = ({ isSyncing, progress, totalFiles, syncedFiles }: SyncIndicatorProps) => {
  if (!isSyncing && progress === 100) {
    return null;
  }

  return (
    <AnimatePresence>
      {(isSyncing || progress < 100) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="glass-card rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 text-primary" />
            )}
            
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full gradient-brand rounded-full"
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-[3rem]">
                {Math.round(progress)}%
              </span>
            </div>

            {progress === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-success flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-success-foreground" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
