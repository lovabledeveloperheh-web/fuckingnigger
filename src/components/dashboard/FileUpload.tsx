import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileIcon, Loader2, CheckCircle, FolderUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: () => void;
  currentFolder: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

export const FileUpload = ({ onUploadComplete, currentFolder }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File, folderPath: string = currentFolder) => {
    if (!user) return;

    const fileId = crypto.randomUUID();
    // Preserve exact original filename
    const storagePath = `${user.id}/${folderPath === '/' ? '' : folderPath.slice(1)}${fileId}-${file.name}`;

    setUploadingFiles(prev => [...prev, { file, progress: 0, status: 'uploading' }]);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Create file record in database - preserving exact filename
      const { error: dbError } = await supabase.from('files').insert({
        user_id: user.id,
        name: file.name, // Exact original filename
        size: file.size,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
        folder_path: folderPath,
      });

      if (dbError) throw dbError;

      setUploadingFiles(prev =>
        prev.map(f => (f.file === file ? { ...f, progress: 100, status: 'complete' } : f))
      );

      toast.success(`${file.name} uploaded successfully!`);
      
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== file));
        onUploadComplete();
      }, 1500);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadingFiles(prev =>
        prev.map(f => (f.file === file ? { ...f, status: 'error' } : f))
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const processEntry = async (entry: FileSystemEntry, path: string = currentFolder): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      await uploadFile(file, path);
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

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Group files by their relative paths
      const filesByFolder = new Map<string, File[]>();
      
      for (const file of files) {
        // webkitRelativePath contains the full path including folder name
        const relativePath = (file as any).webkitRelativePath || file.name;
        const pathParts = relativePath.split('/');
        pathParts.pop(); // Remove filename
        const folderPath = pathParts.length > 0 ? `/${pathParts.join('/')}/` : currentFolder;
        
        if (!filesByFolder.has(folderPath)) {
          filesByFolder.set(folderPath, []);
        }
        filesByFolder.get(folderPath)!.push(file);
      }

      // Upload files maintaining folder structure
      for (const [folderPath, folderFiles] of filesByFolder) {
        for (const file of folderFiles) {
          await uploadFile(file, folderPath);
        }
      }
    }
    e.target.value = '';
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
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
          {isDragging ? 'Drop files or folders here' : 'Drag & drop files or folders'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
                Files
              </span>
            </Button>
          </label>
          
          <label>
            <input
              type="file"
              // @ts-ignore - webkitdirectory is valid but not in types
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleFolderSelect}
            />
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <FolderUp className="w-4 h-4 mr-2" />
                Folder
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Uploading Files */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50"
              >
                <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: item.status === 'uploading' ? '70%' : '100%' }}
                      className={`h-full rounded-full ${
                        item.status === 'error' ? 'bg-destructive' : 'gradient-brand'
                      }`}
                    />
                  </div>
                </div>
                {item.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                )}
                {item.status === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                )}
                {item.status === 'error' && (
                  <button onClick={() => removeUploadingFile(item.file)}>
                    <X className="w-5 h-5 text-destructive" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
