import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  storage_path: string;
  created_at: string;
}

interface GalleryViewProps {
  files: FileData[];
  onGetSignedUrl: (path: string) => Promise<string | null>;
  onDownload: (file: FileData) => void;
}

export const GalleryView = ({ files, onGetSignedUrl, onDownload }: GalleryViewProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const mediaFiles = useMemo(() => 
    files.filter(f => 
      f.mime_type?.startsWith('image/') || 
      f.mime_type?.startsWith('video/')
    ),
    [files]
  );

  const loadThumbnail = async (file: FileData) => {
    if (thumbnails[file.id]) return;
    const url = await onGetSignedUrl(file.storage_path);
    if (url) {
      setThumbnails(prev => ({ ...prev, [file.id]: url }));
    }
  };

  const selectedFile = selectedIndex !== null ? mediaFiles[selectedIndex] : null;

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < mediaFiles.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const closeModal = () => {
    setSelectedIndex(null);
    setZoom(1);
    setRotation(0);
  };

  if (mediaFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Play className="w-8 h-8" />
        </div>
        <p className="text-lg font-medium">No media files</p>
        <p className="text-sm">Upload images or videos to see them here</p>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {mediaFiles.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden bg-secondary"
            onClick={() => {
              loadThumbnail(file);
              setSelectedIndex(index);
            }}
            onMouseEnter={() => loadThumbnail(file)}
          >
            {thumbnails[file.id] ? (
              file.mime_type?.startsWith('video/') ? (
                <div className="relative w-full h-full">
                  <video 
                    src={thumbnails[file.id]} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <img 
                  src={thumbnails[file.id]} 
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs truncate">{file.name}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeModal}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.25)); }}>
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.25)); }}>
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}>
                <RotateCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); onDownload(selectedFile); }}>
                <Download className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={closeModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/10 w-12 h-12"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}
            {selectedIndex !== null && selectedIndex < mediaFiles.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/10 w-12 h-12"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Media */}
            <div 
              className="max-w-[90vw] max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedFile.mime_type?.startsWith('video/') ? (
                <video
                  src={thumbnails[selectedFile.id]}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh]"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s'
                  }}
                />
              ) : (
                <img
                  src={thumbnails[selectedFile.id]}
                  alt={selectedFile.name}
                  className="max-w-full max-h-[90vh] object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s'
                  }}
                />
              )}
            </div>

            {/* Info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-white/60">
                {selectedIndex !== null && `${selectedIndex + 1} of ${mediaFiles.length}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
