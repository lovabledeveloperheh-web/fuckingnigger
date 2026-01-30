import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Mail, Lock, User, Loader2, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';
import { BiometricLockScreen } from './BiometricLockScreen';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const { signIn, signUp } = useAuth();
  const { status: biometricStatus, authenticate, getCredentials, storeCredentials } = useBiometricAuth();

  useEffect(() => {
    if (biometricStatus.isEnabled && biometricStatus.isAvailable && isLogin) {
      setShowBiometricLock(true);
    }
  }, [biometricStatus.isEnabled, biometricStatus.isAvailable, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        if (biometricStatus.isAvailable) {
          await storeCredentials(email, password);
        }
        
        toast.success('Welcome back!');
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const success = await authenticate();
      if (!success) {
        toast.error('Biometric authentication failed');
        setLoading(false);
        return;
      }

      const credentials = await getCredentials();
      if (credentials) {
        const { error } = await signIn(credentials.username, credentials.password);
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        toast.info('Please sign in with your email first to enable biometric login');
        setShowBiometricLock(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showBiometricLock && isLogin) {
    return (
      <BiometricLockScreen 
        onUnlock={handleBiometricLogin}
        onSkip={() => setShowBiometricLock(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-brand shadow-brand mb-6"
          >
            <Cloud className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">CloudVault</h1>
          <p className="text-muted-foreground mt-3 text-lg">Secure cloud storage for your files</p>
        </div>

        <div className="glass-card-elevated rounded-3xl p-8 md:p-10">
          <div className="flex gap-2 mb-8 p-1 bg-secondary/80 rounded-xl">
            <Button
              variant="ghost"
              className={`flex-1 rounded-lg h-11 font-semibold transition-all ${isLogin ? 'bg-card shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-lg h-11 font-semibold transition-all ${!isLogin ? 'bg-card shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </div>

          {isLogin && biometricStatus.isAvailable && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-6 h-12 rounded-xl border-2 font-medium hover:bg-secondary/50 transition-all"
                onClick={handleBiometricLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Fingerprint className="w-5 h-5 mr-2" />
                )}
                Sign in with {biometricStatus.biometryType === 'faceId' ? 'Face ID' : 'Fingerprint'}
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-medium">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-11 h-12 rounded-xl input-premium"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl input-premium"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 rounded-xl input-premium"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl btn-premium text-base font-semibold" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-semibold"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
