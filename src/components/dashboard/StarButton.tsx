import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StarButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'default';
}

export const StarButton = ({ isFavorite, onToggle, size = 'sm' }: StarButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 transition-colors",
        size === 'sm' && "h-6 w-6"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Star
        className={cn(
          "transition-colors",
          size === 'sm' ? "w-4 h-4" : "w-5 h-5",
          isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
      />
    </Button>
  );
};
