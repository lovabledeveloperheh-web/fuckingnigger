import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/dashboard/Header';
import { StorageIndicator } from '@/components/dashboard/StorageIndicator';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { FileGrid } from '@/components/dashboard/FileGrid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [files, setFiles] = useState<FileData[]>([]);
  const [profile, setProfile] = useState<ProfileData>({ storage_used: 0, storage_limit: 5368709120 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchFiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
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

  const handleRefresh = () => {
    fetchFiles();
    fetchProfile();
  };

  return (
    <div className="min-h-screen">
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />
      
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-72 p-6 min-h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24 space-y-6"
          >
            <StorageIndicator used={profile.storage_used} limit={profile.storage_limit} />
            <FileUpload onUploadComplete={handleRefresh} currentFolder={currentFolder} />
          </motion.div>
        </aside>

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <motion.aside
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            className="fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-border p-6 pt-20 md:hidden"
          >
            <div className="space-y-6">
              <StorageIndicator used={profile.storage_used} limit={profile.storage_limit} />
              <FileUpload onUploadComplete={() => { handleRefresh(); setIsMenuOpen(false); }} currentFolder={currentFolder} />
            </div>
          </motion.aside>
        )}
        
        {/* Overlay for mobile */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-display font-bold">My Files</h1>
              <p className="text-muted-foreground">Manage and organize your cloud storage</p>
            </div>

            {/* Mobile Upload Button */}
            <div className="md:hidden mb-6">
              <FileUpload onUploadComplete={handleRefresh} currentFolder={currentFolder} />
            </div>

            <FileGrid 
              files={files} 
              loading={loading} 
              searchQuery={searchQuery}
              onRefresh={handleRefresh}
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
