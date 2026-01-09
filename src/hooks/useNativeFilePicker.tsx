import { useState, useCallback } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface NativeFile {
  name: string;
  path: string;
  uri: string;
  size: number;
  mimeType: string;
  base64Data?: string;
}

export const useNativeFilePicker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<NativeFile[]>([]);
  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async () => {
    if (!isNative) return true;
    
    try {
      const status = await Filesystem.checkPermissions();
      if (status.publicStorage !== 'granted') {
        const request = await Filesystem.requestPermissions();
        return request.publicStorage === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Filesystem permission error:', error);
      return true;
    }
  }, [isNative]);

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  // Browse device directory and list files
  const browseDirectory = useCallback(async (
    path: string = '',
    directory: Directory = Directory.Documents
  ): Promise<NativeFile[]> => {
    if (!isNative) {
      toast.error('Native file access only available on mobile devices');
      return [];
    }

    setIsLoading(true);
    try {
      await checkPermissions();
      
      const result = await Filesystem.readdir({
        path,
        directory,
      });

      const files: NativeFile[] = result.files
        .filter(file => file.type === 'file')
        .map(file => ({
          name: file.name,
          path: path ? `${path}/${file.name}` : file.name,
          uri: file.uri,
          size: file.size || 0,
          mimeType: getMimeType(file.name),
        }));

      return files;
    } catch (error) {
      console.error('Browse directory error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkPermissions]);

  // Read file as base64 for upload
  const readFileAsBase64 = useCallback(async (
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<string | null> => {
    try {
      const result = await Filesystem.readFile({
        path,
        directory,
      });
      return result.data as string;
    } catch (error) {
      console.error('Read file error:', error);
      return null;
    }
  }, []);

  // Pick files from common directories
  const pickFromDocuments = useCallback(async (): Promise<NativeFile[]> => {
    return browseDirectory('', Directory.Documents);
  }, [browseDirectory]);

  const pickFromDownloads = useCallback(async (): Promise<NativeFile[]> => {
    if (!isNative) return [];
    
    try {
      // On Android, try to access Downloads folder
      const platform = Capacitor.getPlatform();
      if (platform === 'android') {
        return browseDirectory('Download', Directory.ExternalStorage);
      }
      // iOS doesn't have a traditional downloads folder
      return browseDirectory('', Directory.Documents);
    } catch (error) {
      console.error('Downloads access error:', error);
      return [];
    }
  }, [isNative, browseDirectory]);

  const pickFromExternalStorage = useCallback(async (): Promise<NativeFile[]> => {
    if (!isNative) return [];
    
    try {
      return browseDirectory('', Directory.ExternalStorage);
    } catch (error) {
      console.error('External storage access error:', error);
      return [];
    }
  }, [isNative, browseDirectory]);

  // Convert native file to uploadable File object
  const convertToUploadableFile = useCallback(async (
    nativeFile: NativeFile,
    directory: Directory = Directory.Documents
  ): Promise<File | null> => {
    try {
      const base64Data = await readFileAsBase64(nativeFile.path, directory);
      if (!base64Data) return null;

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: nativeFile.mimeType });
      
      return new File([blob], nativeFile.name, { type: nativeFile.mimeType });
    } catch (error) {
      console.error('Convert file error:', error);
      toast.error(`Failed to read ${nativeFile.name}`);
      return null;
    }
  }, [readFileAsBase64]);

  // Select files and prepare for upload
  const selectFiles = useCallback((files: NativeFile[]) => {
    setSelectedFiles(files);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    isLoading,
    isNative,
    selectedFiles,
    browseDirectory,
    pickFromDocuments,
    pickFromDownloads,
    pickFromExternalStorage,
    readFileAsBase64,
    convertToUploadableFile,
    selectFiles,
    clearSelection,
    getMimeType,
  };
};

export { Directory };
