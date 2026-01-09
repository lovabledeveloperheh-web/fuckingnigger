import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  FolderOpen, 
  Download, 
  HardDrive, 
  FileIcon, 
  Check,
  Loader2,
  X,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useNativeFilePicker, NativeFile, Directory } from '@/hooks/useNativeFilePicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

interface NativeFileBrowserProps {
  onUploadComplete: () => void;
  currentFolder: string;
}

type StorageLocation = 'documents' | 'downloads' | 'external';

export const NativeFileBrowser = ({ onUploadComplete, currentFolder }: NativeFileBrowserProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<NativeFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<StorageLocation | null>(null);
  const { user } = useAuth();
  const { 
    isLoading, 
    isNative,
    pickFromDocuments, 
    pickFromDownloads, 
    pickFromExternalStorage,
    convertToUploadableFile 
  } = useNativeFilePicker();

  const isNativePlatform = Capacitor.isNativePlatform();

  if (!isNativePlatform) return null;

  const handleBrowse = async (location: StorageLocation) => {
    setCurrentLocation(location);
    setSelectedFiles(new Set());
    
    let result: NativeFile[] = [];
    switch (location) {
      case 'documents':
        result = await pickFromDocuments();
        break;
      case 'downloads':
        result = await pickFromDownloads();
        break;
      case 'external':
        result = await pickFromExternalStorage();
        break;
    }
    setFiles(result);
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };

  const getDirectory = (): Directory => {
    switch (currentLocation) {
      case 'downloads':
        return Capacitor.getPlatform() === 'android' ? Directory.ExternalStorage : Directory.Documents;
      case 'external':
        return Directory.ExternalStorage;
      default:
        return Directory.Documents;
    }
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.size === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    const selectedFileObjects = files.filter(f => selectedFiles.has(f.path));
    const directory = getDirectory();

    for (const nativeFile of selectedFileObjects) {
      try {
        const file = await convertToUploadableFile(nativeFile, directory);
        if (!file) {
          failCount++;
          continue;
        }

        const fileId = crypto.randomUUID();
        const storagePath = `${user.id}/${currentFolder === '/' ? '' : currentFolder.slice(1)}${fileId}-${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // Create file record
        const { error: dbError } = await supabase.from('files').insert({
          user_id: user.id,
          name: file.name,
          size: file.size,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          folder_path: currentFolder,
        });

        if (dbError) throw dbError;
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        failCount++;
      }
    }

    setIsUploading(false);
    setSelectedFiles(new Set());
    setIsOpen(false);

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''} successfully!`);
      onUploadComplete();
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const goBack = () => {
    setCurrentLocation(null);
    setFiles([]);
    setSelectedFiles(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Smartphone className="w-4 h-4 mr-2" />
          Browse Device Files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentLocation && (
              <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {currentLocation ? 'Select Files' : 'Browse Device'}
          </DialogTitle>
        </DialogHeader>

        {!currentLocation ? (
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => handleBrowse('documents')}
              disabled={isLoading}
            >
              <FolderOpen className="h-6 w-6" />
              <span>Documents</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => handleBrowse('downloads')}
              disabled={isLoading}
            >
              <Download className="h-6 w-6" />
              <span>Downloads</span>
            </Button>
            
            {Capacitor.getPlatform() === 'android' && (
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => handleBrowse('external')}
                disabled={isLoading}
              >
                <HardDrive className="h-6 w-6" />
                <span>External Storage</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files found in this location</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                  >
                    {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedFiles.size} selected
                  </span>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {files.map((file) => (
                        <motion.div
                          key={file.path}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedFiles.has(file.path) 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleFileSelection(file.path)}
                        >
                          <Checkbox 
                            checked={selectedFiles.has(file.path)}
                            onCheckedChange={() => toggleFileSelection(file.path)}
                          />
                          <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={selectedFiles.size === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {selectedFiles.size} File{selectedFiles.size > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
