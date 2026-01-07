import { Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineToggleProps {
  isOffline: boolean;
  onToggle: () => void;
  loading?: boolean;
}

export const OfflineToggle = ({ isOffline, onToggle, loading }: OfflineToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={loading}
    >
      {isOffline ? (
        <Cloud className="w-4 h-4 text-primary" />
      ) : (
        <CloudOff className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );
};
