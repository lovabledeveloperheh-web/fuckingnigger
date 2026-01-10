import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DownloadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  storagePath: string;
  startTime?: number;
  bytesDownloaded: number;
  eta?: number; // seconds remaining
  speed?: number; // bytes per second
}

interface DownloadManagerState {
  downloads: DownloadItem[];
  isMinimized: boolean;
  addDownload: (file: { id: string; name: string; size: number; storage_path: string }) => void;
  removeDownload: (id: string) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  clearCompleted: () => void;
  toggleMinimized: () => void;
}

export const useDownloadManager = create<DownloadManagerState>((set, get) => ({
  downloads: [],
  isMinimized: false,

  addDownload: async (file) => {
    const downloadItem: DownloadItem = {
      id: file.id,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'pending',
      storagePath: file.storage_path,
      bytesDownloaded: 0,
    };

    // Check if already downloading
    if (get().downloads.some(d => d.id === file.id && d.status === 'downloading')) {
      toast.info(`${file.name} is already downloading`);
      return;
    }

    set((state) => ({ 
      downloads: state.downloads.filter(d => d.id !== file.id).concat(downloadItem) 
    }));

    get().updateDownload(file.id, { status: 'downloading', startTime: Date.now() });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/user-files/${file.storage_path}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Download failed');

      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength) : file.size;
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        const progress = Math.round((receivedLength / totalSize) * 100);
        const elapsed = (Date.now() - (get().downloads.find(d => d.id === file.id)?.startTime || Date.now())) / 1000;
        const speed = receivedLength / elapsed;
        const remaining = totalSize - receivedLength;
        const eta = speed > 0 ? Math.round(remaining / speed) : 0;
        
        get().updateDownload(file.id, {
          progress,
          bytesDownloaded: receivedLength,
          eta,
          speed,
        });
      }

      // Create blob and trigger download
      const blob = new Blob(chunks as BlobPart[]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      get().updateDownload(file.id, { status: 'complete', progress: 100 });
      toast.success(`${file.name} downloaded!`);

    } catch (error) {
      console.error('Download error:', error);
      get().updateDownload(file.id, { status: 'error', progress: 0 });
      toast.error(`Failed to download ${file.name}`);
    }
  },

  removeDownload: (id: string) => {
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id),
    }));
  },

  updateDownload: (id: string, updates: Partial<DownloadItem>) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      downloads: state.downloads.filter((d) => d.status !== 'complete'),
    }));
  },

  toggleMinimized: () => {
    set((state) => ({ isMinimized: !state.isMinimized }));
  },
}));
