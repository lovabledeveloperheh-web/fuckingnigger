import { Capacitor } from '@capacitor/core';

// Platform detection utilities
export const isNative = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isWeb = () => Capacitor.getPlatform() === 'web';

// Get the current platform
export const getPlatform = () => Capacitor.getPlatform();

// Convert a web path to a native path if needed
export const convertFileSrc = (filePath: string) => {
  return Capacitor.convertFileSrc(filePath);
};

// Check if a plugin is available
export const isPluginAvailable = (pluginName: string) => {
  return Capacitor.isPluginAvailable(pluginName);
};
