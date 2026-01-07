import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import Dashboard from './Dashboard';
import { Loader2, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand shadow-brand mb-4">
            <Cloud className="w-8 h-8 text-primary-foreground animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthForm />;
};

export default Index;
