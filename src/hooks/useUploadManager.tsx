import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notificationService } from '@/lib/notifications';

export interface UploadItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  storagePath: string;
  folderPath: string;
  userId: string;
  startTime?: number;
  bytesUploaded: number;
  eta?: number; // seconds remaining
}

interface UploadManagerState {
  uploads: UploadItem[];
  isMinimized: boolean;
  addUpload: (file: File, userId: string, folderPath: string) => void;
  removeUpload: (id: string) => void;
  updateUpload: (id: string, updates: Partial<UploadItem>) => void;
  clearCompleted: () => void;
  toggleMinimized: () => void;
}

export const useUploadManager = create<UploadManagerState>((set, get) => ({
  uploads: [],
  isMinimized: false,

  addUpload: async (file: File, userId: string, folderPath: string) => {
    const id = crypto.randomUUID();
    const storagePath = `${userId}/${folderPath === '/' ? '' : folderPath.slice(1)}${id}-${file.name}`;

    const uploadItem: UploadItem = {
      id,
      file,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'pending',
      storagePath,
      folderPath,
      userId,
      bytesUploaded: 0,
    };

    set((state) => ({ uploads: [...state.uploads, uploadItem] }));

    // Start upload
    get().updateUpload(id, { status: 'uploading', startTime: Date.now() });

    try {
      // Use XMLHttpRequest for progress tracking
      const formData = new FormData();
      formData.append('', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          const elapsed = (Date.now() - (get().uploads.find(u => u.id === id)?.startTime || Date.now())) / 1000;
          const speed = event.loaded / elapsed; // bytes per second
          const remaining = event.total - event.loaded;
          const eta = speed > 0 ? Math.round(remaining / speed) : 0;
          
          get().updateUpload(id, { 
            progress, 
            bytesUploaded: event.loaded,
            eta 
          });
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Add to database
          const { error: dbError } = await supabase.from('files').insert({
            user_id: userId,
            name: file.name,
            size: file.size,
            mime_type: file.type || 'application/octet-stream',
            storage_path: storagePath,
            folder_path: folderPath,
          });

          if (dbError) {
            get().updateUpload(id, { status: 'error', progress: 0 });
            toast.error(`Failed to save ${file.name}`);
            notificationService.notifyUploadFailed(file.name, 'Failed to save file');
          } else {
            get().updateUpload(id, { status: 'complete', progress: 100 });
            // Use notification service for upload complete
            notificationService.notifyUploadComplete(file.name);
          }
        } else {
          get().updateUpload(id, { status: 'error', progress: 0 });
          toast.error(`Failed to upload ${file.name}`);
          notificationService.notifyUploadFailed(file.name);
        }
      });

      xhr.addEventListener('error', () => {
        get().updateUpload(id, { status: 'error', progress: 0 });
        toast.error(`Failed to upload ${file.name}`);
        notificationService.notifyUploadFailed(file.name, 'Network error');
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/user-files/${storagePath}`);
      xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.send(file);

    } catch (error) {
      console.error('Upload error:', error);
      get().updateUpload(id, { status: 'error', progress: 0 });
      toast.error(`Failed to upload ${file.name}`);
    }
  },

  removeUpload: (id: string) => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    }));
  },

  updateUpload: (id: string, updates: Partial<UploadItem>) => {
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status !== 'complete'),
    }));
  },

  toggleMinimized: () => {
    set((state) => ({ isMinimized: !state.isMinimized }));
  },
}));
