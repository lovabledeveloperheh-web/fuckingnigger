import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileIcon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCamera } from '@/hooks/useCamera';
import { NativeFileBrowser } from './NativeFileBrowser';
import { Capacitor } from '@capacitor/core';
import { useUploadManager } from '@/hooks/useUploadManager';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: () => void;
  currentFolder: string;
}

export const FileUpload = ({ onUploadComplete, currentFolder }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuth();
  const { takePhoto, pickFromGallery, isLoading: cameraLoading } = useCamera();
  const isNativePlatform = Capacitor.isNativePlatform();
  const { addUpload } = useUploadManager();

  const uploadFile = (file: File, folderPath: string = currentFolder) => {
    if (!user) return;
    addUpload(file, user.id, folderPath);
    toast.info(`${file.name} added to upload queue`);
  };

  // Handle camera photo upload
  const handleCameraUpload = async (source: 'camera' | 'gallery') => {
    const photo = source === 'camera' ? await takePhoto() : await pickFromGallery();
    if (!photo?.base64String || !user) return;

    const fileName = `photo_${Date.now()}.${photo.format}`;
    const mimeType = `image/${photo.format}`;

    // Convert base64 to File
    const byteCharacters = atob(photo.base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    uploadFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processEntry = async (entry: FileSystemEntry, path: string = currentFolder): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      uploadFile(file, path);
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const folderPath = `${path}${entry.name}/`;
      const reader = dirEntry.createReader();
      
      const readEntries = (): Promise<FileSystemEntry[]> => {
        return new Promise((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
      };

      const entries = await readEntries();
      for (const subEntry of entries) {
        await processEntry(subEntry, folderPath);
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }
    }
  }, [user, currentFolder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => uploadFile(file));
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`upload-zone text-center ${isDragging ? 'upload-zone-active' : ''}`}
      >
        <motion.div
          animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4"
        >
          <Upload className="w-7 h-7 text-primary" />
        </motion.div>
        
        <h3 className="font-medium text-foreground mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center flex-wrap">
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </span>
            </Button>
          </label>

          {/* Native Camera/Gallery buttons */}
          {isNativePlatform && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleCameraUpload('camera')}
                disabled={cameraLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleCameraUpload('gallery')}
                disabled={cameraLoading}
              >
                <FileIcon className="w-4 h-4 mr-2" />
                Gallery
              </Button>
            </>
          )}
        </div>

        {/* Native File Browser */}
        {isNativePlatform && (
          <div className="mt-4">
            <NativeFileBrowser 
              onUploadComplete={onUploadComplete}
              currentFolder={currentFolder}
            />
          </div>
        )}
      </div>
    </div>
  );
};
