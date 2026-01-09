import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface CapturedPhoto {
  webPath?: string;
  base64String?: string;
  format: string;
}

export const useCamera = () => {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async () => {
    if (!isNative) return true;
    
    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions();
        return request.camera === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }, [isNative]);

  const takePhoto = useCallback(async (): Promise<CapturedPhoto | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        toast.error('Camera permission denied');
        return null;
      }

      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      const capturedPhoto: CapturedPhoto = {
        webPath: image.webPath,
        base64String: image.base64String,
        format: image.format,
      };

      setPhoto(capturedPhoto);
      toast.success('Photo captured!');
      return capturedPhoto;
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        console.error('Camera error:', error);
        toast.error('Failed to capture photo');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);

  const pickFromGallery = useCallback(async (): Promise<CapturedPhoto | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        toast.error('Photo library permission denied');
        return null;
      }

      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      const capturedPhoto: CapturedPhoto = {
        webPath: image.webPath,
        base64String: image.base64String,
        format: image.format,
      };

      setPhoto(capturedPhoto);
      return capturedPhoto;
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        console.error('Gallery error:', error);
        toast.error('Failed to select photo');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  return {
    photo,
    isLoading,
    isNative,
    takePhoto,
    pickFromGallery,
    clearPhoto,
  };
};
