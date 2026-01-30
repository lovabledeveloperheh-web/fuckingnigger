import { useState, useEffect } from 'react';
import { User, Bell, Palette, Save, Loader2, Settings, Smartphone, Fingerprint, Shield } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { Capacitor } from '@capacitor/core';

interface ProfileData {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  uploadComplete: boolean;
  shareActivity: boolean;
  storageWarnings: boolean;
}

export const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isRegistered, register, unregister, isNative } = usePushNotifications();
  const { status: biometricStatus, enableBiometric, disableBiometric } = useBiometricAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [enablingBiometric, setEnablingBiometric] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    avatar_url: '',
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    uploadComplete: true,
    shareActivity: true,
    storageWarnings: true,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        setProfile({
          full_name: '',
          email: user.email || '',
          avatar_url: '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationPreferences) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success('Notification preferences updated');
  };

  if (loading) {
    return (
      <PageLayout 
        title="Settings" 
        icon={<Settings className="w-6 h-6" />}
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Settings" 
      icon={<Settings className="w-6 h-6" />}
      subtitle="Manage your account preferences"
    >
      <div className="max-w-2xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={profile.avatar_url || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="Enter avatar URL"
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  Biometric Authentication
                </CardTitle>
                <CardDescription>
                  {biometricStatus.isAvailable 
                    ? `Use ${biometricStatus.biometryType === 'faceId' ? 'Face ID' : biometricStatus.biometryType === 'fingerprint' ? 'Fingerprint' : 'Biometrics'} to secure your app`
                    : Capacitor.isNativePlatform() 
                      ? "Biometric authentication is not available on this device"
                      : "Biometric authentication is only available on the native mobile app"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      {biometricStatus.biometryType === 'faceId' ? 'Face ID' : 
                       biometricStatus.biometryType === 'fingerprint' ? 'Fingerprint Lock' : 
                       'Biometric Lock'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {biometricStatus.isEnabled 
                        ? "Your app is secured with biometrics" 
                        : biometricStatus.isAvailable 
                          ? "Enable to require biometric verification when opening the app"
                          : "Not available on this device"}
                    </p>
                  </div>
                  <Switch
                    checked={biometricStatus.isEnabled}
                    disabled={!biometricStatus.isAvailable || enablingBiometric}
                    onCheckedChange={async (checked) => {
                      setEnablingBiometric(true);
                      try {
                        if (checked) {
                          const success = await enableBiometric();
                          if (success) {
                            toast.success('Biometric authentication enabled!');
                          } else {
                            toast.error('Failed to enable biometrics');
                          }
                        } else {
                          disableBiometric();
                          toast.success('Biometric authentication disabled');
                        }
                      } finally {
                        setEnablingBiometric(false);
                      }
                    }}
                  />
                </div>

                {biometricStatus.isAvailable && (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Fingerprint className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">How it works</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          When enabled, you'll need to verify your identity with 
                          {biometricStatus.biometryType === 'faceId' ? ' Face ID' : 
                           biometricStatus.biometryType === 'fingerprint' ? ' your fingerprint' : 
                           ' biometrics'} each time you open CloudVault.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  {isNative 
                    ? "Enable push notifications to get alerts even when the app is closed"
                    : "Push notifications are only available on the native mobile app"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      {isRegistered 
                        ? "Push notifications are enabled" 
                        : isNative 
                          ? "Tap to enable push notifications"
                          : "Install the native app for push notifications"}
                    </p>
                  </div>
                  <Switch
                    checked={isRegistered}
                    disabled={!isNative || enablingPush}
                    onCheckedChange={async (checked) => {
                      setEnablingPush(true);
                      try {
                        if (checked) {
                          await register();
                        } else {
                          await unregister();
                        }
                      } finally {
                        setEnablingPush(false);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={() => handleNotificationChange('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Upload Complete</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when uploads finish
                    </p>
                  </div>
                  <Switch
                    checked={notifications.uploadComplete}
                    onCheckedChange={() => handleNotificationChange('uploadComplete')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about shared file activity
                    </p>
                  </div>
                  <Switch
                    checked={notifications.shareActivity}
                    onCheckedChange={() => handleNotificationChange('shareActivity')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Storage Warnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when storage is running low
                    </p>
                  </div>
                  <Switch
                    checked={notifications.storageWarnings}
                    onCheckedChange={() => handleNotificationChange('storageWarnings')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how CloudVault looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme for the application
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      className="w-full flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme('light')}
                    >
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2"/>
                        <path d="M12 20v2"/>
                        <path d="m4.93 4.93 1.41 1.41"/>
                        <path d="m17.66 17.66 1.41 1.41"/>
                        <path d="M2 12h2"/>
                        <path d="M20 12h2"/>
                        <path d="m6.34 17.66-1.41 1.41"/>
                        <path d="m19.07 4.93-1.41 1.41"/>
                      </svg>
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      className="w-full flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme('dark')}
                    >
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                      </svg>
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      className="w-full flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme('system')}
                    >
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="3" rx="2"/>
                        <line x1="8" x2="16" y1="21" y2="21"/>
                        <line x1="12" x2="12" y1="17" y2="21"/>
                      </svg>
                      <span>System</span>
                    </Button>
                  </div>
                </div>

                {/* Dark Mode Toggle Switch */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Quick toggle for dark mode
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;