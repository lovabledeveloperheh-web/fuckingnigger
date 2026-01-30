import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

interface BiometricStatus {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'faceId' | 'iris' | 'none';
  isEnabled: boolean;
}

export const useBiometricAuth = () => {
  const [status, setStatus] = useState<BiometricStatus>({
    isAvailable: false,
    biometryType: 'none',
    isEnabled: false,
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus(prev => ({ ...prev, isAvailable: false, biometryType: 'none' }));
      return;
    }

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      const result = await NativeBiometric.isAvailable();
      
      setStatus(prev => ({
        ...prev,
        isAvailable: result.isAvailable,
        biometryType: result.biometryType === 1 ? 'fingerprint' : 
                      result.biometryType === 2 ? 'faceId' : 
                      result.biometryType === 3 ? 'iris' : 'none',
      }));
    } catch (error) {
      console.error('Biometric check failed:', error);
      setStatus(prev => ({ ...prev, isAvailable: false }));
    }
  };

  const loadBiometricPreference = () => {
    const enabled = localStorage.getItem('biometric_enabled') === 'true';
    setStatus(prev => ({ ...prev, isEnabled: enabled }));
  };

  const enableBiometric = useCallback(async () => {
    if (!status.isAvailable) return false;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      
      // Verify biometric first
      await NativeBiometric.verifyIdentity({
        reason: 'Enable biometric authentication',
        title: 'Enable Biometric Login',
        subtitle: 'Use your fingerprint or face to unlock CloudVault',
        description: 'Secure your app with biometric authentication',
      });

      localStorage.setItem('biometric_enabled', 'true');
      setStatus(prev => ({ ...prev, isEnabled: true }));
      return true;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  }, [status.isAvailable]);

  const disableBiometric = useCallback(() => {
    localStorage.removeItem('biometric_enabled');
    setStatus(prev => ({ ...prev, isEnabled: false }));
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!status.isAvailable || !status.isEnabled) {
      return true; // Skip if not enabled
    }

    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    setIsAuthenticating(true);

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      
      await NativeBiometric.verifyIdentity({
        reason: 'Unlock CloudVault',
        title: 'Verify Identity',
        subtitle: 'Use your fingerprint or face to continue',
        description: 'Authentication required to access your files',
      });

      setIsAuthenticating(false);
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      setIsAuthenticating(false);
      return false;
    }
  }, [status.isAvailable, status.isEnabled]);

  const storeCredentials = useCallback(async (username: string, password: string) => {
    if (!Capacitor.isNativePlatform() || !status.isAvailable) return false;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      
      await NativeBiometric.setCredentials({
        username,
        password,
        server: 'cloudvault.lovable.app',
      });
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return false;
    }
  }, [status.isAvailable]);

  const getCredentials = useCallback(async (): Promise<{ username: string; password: string } | null> => {
    if (!Capacitor.isNativePlatform() || !status.isAvailable) return null;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      
      const credentials = await NativeBiometric.getCredentials({
        server: 'cloudvault.lovable.app',
      });
      return credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }, [status.isAvailable]);

  const deleteCredentials = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.deleteCredentials({
        server: 'cloudvault.lovable.app',
      });
    } catch (error) {
      console.error('Failed to delete credentials:', error);
    }
  }, []);

  return {
    status,
    isAuthenticating,
    enableBiometric,
    disableBiometric,
    authenticate,
    storeCredentials,
    getCredentials,
    deleteCredentials,
  };
};
