import { useEffect, useState, useCallback } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface NotificationState {
  isRegistered: boolean;
  token: string | null;
  notifications: PushNotificationSchema[];
}

export const usePushNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isRegistered: false,
    token: null,
    notifications: [],
  });
  const [isSupported, setIsSupported] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const checkSupport = async () => {
      if (!isNative) {
        setIsSupported(false);
        return;
      }
      setIsSupported(true);
    };
    checkSupport();
  }, [isNative]);

  const register = useCallback(async () => {
    if (!isNative) {
      toast.error('Push notifications only work on native devices');
      return;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        toast.error('Push notification permission denied');
        return;
      }

      // Register with Apple / Google to receive push via APNS / FCM
      await PushNotifications.register();

      // Listen for successful registration
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setState(prev => ({
          ...prev,
          isRegistered: true,
          token: token.value,
        }));
        toast.success('Push notifications enabled!');
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        toast.error('Failed to register for push notifications');
      });

      // Listen for incoming notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        setState(prev => ({
          ...prev,
          notifications: [...prev.notifications, notification],
        }));
        
        // Show local notification since push won't show when app is in foreground
        LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: notification.title || 'CloudVault',
            body: notification.body || '',
            schedule: { at: new Date(Date.now() + 100) },
          }],
        });
      });

      // Listen for notification actions (when user taps notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push action performed:', action);
        // Handle notification tap - navigate to relevant screen
      });

    } catch (error) {
      console.error('Push notification setup error:', error);
      toast.error('Failed to setup push notifications');
    }
  }, [isNative]);

  const unregister = useCallback(async () => {
    if (!isNative) return;

    try {
      await PushNotifications.removeAllListeners();
      setState({
        isRegistered: false,
        token: null,
        notifications: [],
      });
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Push unregister error:', error);
    }
  }, [isNative]);

  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    scheduledAt?: Date
  ) => {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      
      if (permStatus.display !== 'granted') {
        const request = await LocalNotifications.requestPermissions();
        if (request.display !== 'granted') {
          toast.error('Local notification permission denied');
          return;
        }
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title,
          body,
          schedule: scheduledAt ? { at: scheduledAt } : { at: new Date(Date.now() + 1000) },
        }],
      });

      toast.success('Notification scheduled');
    } catch (error) {
      console.error('Local notification error:', error);
      toast.error('Failed to schedule notification');
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  return {
    ...state,
    isSupported,
    isNative,
    register,
    unregister,
    scheduleLocalNotification,
    clearNotifications,
  };
};
