import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, FileText, Music, Video, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
}

interface FilePreviewModalProps {
  file: FileData | null;
  files: FileData[];
  onClose: () => void;
  onDownload: (file: FileData) => void;
}

export const FilePreviewModal = ({ file, files, onClose, onDownload }: FilePreviewModalProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (file) {
      const index = files.findIndex(f => f.id === file.id);
      setCurrentIndex(index >= 0 ? index : 0);
      loadPreview(file);
    }
  }, [file]);

  const loadPreview = async (f: FileData) => {
    setLoading(true);
    setZoom(1);
    setRotation(0);
    
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(f.storage_path, 3600);

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const currentFile = files[currentIndex] || file;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      loadPreview(files[newIndex]);
    }
  };

  const goToNext = () => {
    if (currentIndex < files.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      loadPreview(files[newIndex]);
    }
  };

  const isImage = currentFile?.mime_type?.startsWith('image/');
  const isVideo = currentFile?.mime_type?.startsWith('video/');
  const isAudio = currentFile?.mime_type?.startsWith('audio/');
  const isPdf = currentFile?.mime_type === 'application/pdf';
  const isText = currentFile?.mime_type?.startsWith('text/');

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <File className="w-16 h-16 mb-4" />
          <p>Preview not available</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <motion.img
          src={previewUrl}
          alt={currentFile?.name}
          style={{ 
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease'
          }}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={previewUrl}
          controls
          className="max-w-full max-h-full"
          autoPlay={false}
        >
          Your browser does not support video playback.
        </video>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-32 h-32 rounded-full gradient-brand flex items-center justify-center mb-6">
            <Music className="w-16 h-16 text-primary-foreground" />
          </div>
          <p className="text-lg font-medium mb-4">{currentFile?.name}</p>
          <audio src={previewUrl} controls className="w-full max-w-md">
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full rounded-lg"
          title={currentFile?.name}
        />
      );
    }

    if (isText) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full rounded-lg bg-card"
          title={currentFile?.name}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium mb-2">{currentFile?.name}</p>
        <p className="text-sm">This file type cannot be previewed</p>
        <Button 
          onClick={() => currentFile && onDownload(currentFile)} 
          className="mt-4 gradient-brand"
        >
          <Download className="w-4 h-4 mr-2" />
          Download to view
        </Button>
      </div>
    );
  };

  if (!file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 bg-background/10 backdrop-blur-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h3 className="font-medium text-primary-foreground truncate">
              {currentFile?.name}
            </h3>
            <span className="text-sm text-primary-foreground/60">
              {currentIndex + 1} / {files.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.25)); }}
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.25)); }}
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={(e) => { e.stopPropagation(); currentFile && onDownload(currentFile); }}
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div 
          className="flex-1 flex items-center justify-center p-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {renderPreview()}
        </div>

        {/* Navigation */}
        {files.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-30"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-30"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              disabled={currentIndex === files.length - 1}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
