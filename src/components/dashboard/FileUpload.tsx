import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileIcon, Loader2, CheckCircle } from 'lucide-react';
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

  const uploadFile = async (file: File) => {
    if (!user) return;

    const fileId = crypto.randomUUID();
    const storagePath = `${user.id}/${fileId}-${file.name}`;

    setUploadingFiles(prev => [...prev, { file, progress: 0, status: 'uploading' }]);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Create file record in database
      const { error: dbError } = await supabase.from('files').insert({
        user_id: user.id,
        name: file.name,
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        folder_path: currentFolder,
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  }, [user, currentFolder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(uploadFile);
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
          {isDragging ? 'Drop files here' : 'Drag & drop files'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        
        <label>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button variant="outline" className="cursor-pointer" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
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
                <FileIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
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
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {item.status === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-success" />
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
