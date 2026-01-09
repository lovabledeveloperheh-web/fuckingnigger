import { useState, useCallback } from 'react';
import { Filesystem, Directory, Encoding, ReadFileResult, WriteFileResult } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  uri?: string;
  mtime?: number;
}

export const useNativeFileSystem = () => {
  const [isLoading, setIsLoading] = useState(false);
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
      return true; // Some platforms don't require explicit permission
    }
  }, [isNative]);

  const readFile = useCallback(async (
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const result: ReadFileResult = await Filesystem.readFile({
        path,
        directory,
        encoding: Encoding.UTF8,
      });
      return result.data as string;
    } catch (error) {
      console.error('Read file error:', error);
      toast.error('Failed to read file');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const readBinaryFile = useCallback(async (
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const result: ReadFileResult = await Filesystem.readFile({
        path,
        directory,
      });
      return result.data as string; // Base64 encoded
    } catch (error) {
      console.error('Read binary file error:', error);
      toast.error('Failed to read file');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const writeFile = useCallback(async (
    path: string,
    data: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await checkPermissions();
      
      const result: WriteFileResult = await Filesystem.writeFile({
        path,
        data,
        directory,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      
      console.log('File written:', result.uri);
      return true;
    } catch (error) {
      console.error('Write file error:', error);
      toast.error('Failed to write file');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);

  const writeBinaryFile = useCallback(async (
    path: string,
    base64Data: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await checkPermissions();
      
      await Filesystem.writeFile({
        path,
        data: base64Data,
        directory,
        recursive: true,
      });
      
      return true;
    } catch (error) {
      console.error('Write binary file error:', error);
      toast.error('Failed to write file');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);

  const deleteFile = useCallback(async (
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await Filesystem.deleteFile({
        path,
        directory,
      });
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      toast.error('Failed to delete file');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listDirectory = useCallback(async (
    path: string = '',
    directory: Directory = Directory.Documents
  ): Promise<FileInfo[]> => {
    setIsLoading(true);
    try {
      const result = await Filesystem.readdir({
        path,
        directory,
      });
      
      return result.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        uri: file.uri,
        mtime: file.mtime,
      }));
    } catch (error) {
      console.error('List directory error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDirectory = useCallback(async (
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await Filesystem.mkdir({
        path,
        directory,
        recursive: true,
      });
      return true;
    } catch (error) {
      console.error('Create directory error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const copyFile = useCallback(async (
    from: string,
    to: string,
    fromDirectory: Directory = Directory.Documents,
    toDirectory: Directory = Directory.Documents
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await Filesystem.copy({
        from,
        to,
        directory: fromDirectory,
        toDirectory,
      });
      return true;
    } catch (error) {
      console.error('Copy file error:', error);
      toast.error('Failed to copy file');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFileInfo = useCallback(async (
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<FileInfo | null> => {
    try {
      const result = await Filesystem.stat({
        path,
        directory,
      });
      
      return {
        name: path.split('/').pop() || path,
        type: result.type,
        size: result.size,
        uri: result.uri,
        mtime: result.mtime,
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }, []);

  const downloadToDevice = useCallback(async (
    url: string,
    fileName: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await checkPermissions();
      
      // Fetch the file
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;
      
      // Write to filesystem
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory,
        recursive: true,
      });
      
      toast.success(`File saved: ${fileName}`);
      return true;
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);

  return {
    isLoading,
    isNative,
    readFile,
    readBinaryFile,
    writeFile,
    writeBinaryFile,
    deleteFile,
    listDirectory,
    createDirectory,
    copyFile,
    getFileInfo,
    downloadToDevice,
  };
};

// Export Directory enum for convenience
export { Directory };
