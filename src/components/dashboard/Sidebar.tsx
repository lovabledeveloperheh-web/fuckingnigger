import { NavLink, useLocation } from 'react-router-dom';
import { 
  FolderOpen, Clock, Star, Image, Link, CloudOff, 
  Trash2, BarChart3, Calendar, Settings, X, Cloud, Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StorageIndicator } from './StorageIndicator';
import { OnlineStatusBadge } from './OfflineIndicator';
import { useOffline } from '@/hooks/useOffline';

interface SidebarProps {
  storageUsed: number;
  storageLimit: number;
  onUploadComplete: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

const navItems = [
  { path: '/', icon: FolderOpen, label: 'My Files', exact: true },
  { path: '/dashboard/upload', icon: Upload, label: 'Upload Files' },
  { path: '/dashboard/recent', icon: Clock, label: 'Recent' },
  { path: '/dashboard/favorites', icon: Star, label: 'Favorites' },
  { path: '/dashboard/gallery', icon: Image, label: 'Gallery' },
  { path: '/dashboard/shared', icon: Link, label: 'Shared Links' },
  { path: '/dashboard/offline', icon: CloudOff, label: 'Offline Files' },
  { path: '/dashboard/trash', icon: Trash2, label: 'Trash' },
  { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/dashboard/backup', icon: Calendar, label: 'Backup' },
];

export const Sidebar = ({ 
  storageUsed, 
  storageLimit, 
  onUploadComplete,
  isMobile,
  onClose,
  className
}: SidebarProps) => {
  const location = useLocation();
  const { isOnline } = useOffline();

  return (
    <motion.aside
      initial={isMobile ? { x: -280 } : false}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      className={cn(
        "flex flex-col bg-card border-r border-border h-full",
        isMobile ? "fixed inset-y-0 left-0 z-50 w-72" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Cloud className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">CloudVault</span>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Online Status */}
      <div className="px-4 py-2">
        <OnlineStatusBadge isOnline={isOnline} />
      </div>

      {/* Storage */}
      <div className="px-4 py-2">
        <StorageIndicator used={storageUsed} limit={storageLimit} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/dashboard/settings"
          onClick={isMobile ? onClose : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </motion.aside>
  );
};
