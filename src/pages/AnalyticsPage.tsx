import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StorageChart } from '@/components/analytics/StorageChart';
import { FileTypeBreakdown } from '@/components/analytics/FileTypeBreakdown';
import { LargestFiles } from '@/components/analytics/LargestFiles';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  created_at: string;
}

interface ProfileData {
  storage_used: number;
  storage_limit: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [filesRes, profileRes] = await Promise.all([
          supabase
            .from('files')
            .select('id, name, size, mime_type, created_at')
            .eq('user_id', user.id)
            .eq('is_deleted', false),
          supabase
            .from('profiles')
            .select('storage_used, storage_limit')
            .eq('user_id', user.id)
            .single()
        ]);

        if (filesRes.data) setFiles(filesRes.data);
        if (profileRes.data) setProfile(profileRes.data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const usagePercent = profile ? ((profile.storage_used / profile.storage_limit) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Storage Analytics
        </h1>
        <p className="text-muted-foreground">
          Insights about your storage usage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Files</CardDescription>
            <CardTitle className="text-3xl">{totalFiles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Storage Used</CardDescription>
            <CardTitle className="text-3xl">{formatSize(totalSize)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usage</CardDescription>
            <CardTitle className="text-3xl">{usagePercent}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              of {profile ? formatSize(profile.storage_limit) : '1 PB'} limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage by Type</CardTitle>
            <CardDescription>How your storage is distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <StorageChart files={files} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Extensions</CardTitle>
            <CardDescription>Storage by file extension</CardDescription>
          </CardHeader>
          <CardContent>
            <FileTypeBreakdown files={files} />
          </CardContent>
        </Card>
      </div>

      {/* Largest Files */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Hogs</CardTitle>
          <CardDescription>Your largest files taking up space</CardDescription>
        </CardHeader>
        <CardContent>
          <LargestFiles files={files} />
        </CardContent>
      </Card>
    </div>
  );
};
