import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/dashboard/Header';
import { FileGrid } from '@/components/dashboard/FileGrid';
import { SyncIndicator } from '@/components/dashboard/SyncIndicator';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { OfflineIndicator } from '@/components/dashboard/OfflineIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFileSync } from '@/hooks/useFileSync';
import { useFavorites } from '@/hooks/useFavorites';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  created_at: string;
  storage_path: string;
  folder_path: string;
}

interface ProfileData {
  storage_used: number;
  storage_limit: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { syncState } = useFileSync();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [files, setFiles] = useState<FileData[]>([]);
  const [profile, setProfile] = useState<ProfileData>({ storage_used: 0, storage_limit: 1125899906842624 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchFiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('storage_used, storage_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchProfile();
  }, [user]);

  // Set up realtime subscription for files
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh files on any change
          fetchFiles();
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Refresh when sync completes
  useEffect(() => {
    if (!syncState.isSyncing && syncState.progress === 100 && syncState.syncedFiles > 0) {
      fetchFiles();
      fetchProfile();
    }
  }, [syncState.isSyncing]);

  const handleRefresh = () => {
    fetchFiles();
    fetchProfile();
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <Sidebar 
        storageUsed={profile.storage_used} 
        storageLimit={profile.storage_limit}
        onUploadComplete={handleRefresh}
        className="hidden md:flex"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMenuOpen={isMenuOpen}
        />

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <>
            <motion.aside
              initial={{ opacity: 0, x: -280 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -280 }}
              className="fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-border md:hidden overflow-y-auto"
            >
              <Sidebar 
                storageUsed={profile.storage_used} 
                storageLimit={profile.storage_limit}
                onUploadComplete={() => { handleRefresh(); setIsMenuOpen(false); }}
                isMobile
                onClose={() => setIsMenuOpen(false)}
              />
            </motion.aside>
            <div 
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-1">My Files</h1>
              <p className="text-muted-foreground text-lg">Manage and organize your cloud storage</p>
            </div>

            <FileGrid 
              files={files} 
              loading={loading} 
              searchQuery={searchQuery}
              onRefresh={handleRefresh}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
          </motion.div>
        </main>
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Sync Progress Indicator */}
      <SyncIndicator 
        isSyncing={syncState.isSyncing}
        progress={syncState.progress}
        totalFiles={syncState.totalFiles}
        syncedFiles={syncState.syncedFiles}
      />
    </div>
  );
};

export default Dashboard;
