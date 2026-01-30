import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Cloud, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface BiometricLockScreenProps {
  onUnlock: () => void;
  onSkip: () => void;
}

export const BiometricLockScreen = ({ onUnlock, onSkip }: BiometricLockScreenProps) => {
  const { authenticate, status, isAuthenticating } = useBiometricAuth();
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Auto-trigger biometric on mount
    handleBiometricAuth();
  }, []);

  const handleBiometricAuth = async () => {
    setError(null);
    const success = await authenticate();
    
    if (success) {
      onUnlock();
    } else {
      setAttempts(prev => prev + 1);
      setError('Authentication failed. Please try again.');
    }
  };

  const getBiometricLabel = () => {
    switch (status.biometryType) {
      case 'faceId':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm text-center relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-brand shadow-brand mb-8"
        >
          <Cloud className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <h1 className="text-3xl font-bold text-foreground mb-2">CloudVault</h1>
        <p className="text-muted-foreground mb-10">Unlock with {getBiometricLabel()}</p>

        {/* Biometric Button */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            size="lg"
            className="w-32 h-32 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={handleBiometricAuth}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <Fingerprint className="w-12 h-12 text-primary" />
            )}
          </Button>
        </motion.div>

        <p className="text-sm text-muted-foreground mt-6">
          {isAuthenticating ? 'Verifying...' : `Tap to unlock with ${getBiometricLabel()}`}
        </p>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mt-4 text-destructive"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Skip option after multiple attempts */}
        {attempts >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Use password instead
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
