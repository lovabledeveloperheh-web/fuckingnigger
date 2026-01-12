import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  showBackButton?: boolean;
}

export const PageLayout = ({ 
  children, 
  title, 
  subtitle, 
  icon,
  actions,
  showBackButton = true 
}: PageLayoutProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <Sidebar 
        storageUsed={0} 
        storageLimit={1125899906842624}
        onUploadComplete={() => {}}
        className="hidden md:flex"
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              {/* Back button */}
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {isMenuOpen && (
          <>
            <motion.aside
              initial={{ opacity: 0, x: -280 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -280 }}
              className="fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-border md:hidden overflow-y-auto"
            >
              <Sidebar 
                storageUsed={0} 
                storageLimit={1125899906842624}
                onUploadComplete={() => setIsMenuOpen(false)}
                isMobile
                onClose={() => setIsMenuOpen(false)}
              />
            </motion.aside>
            <div 
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {icon}
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>

            {/* Page Content */}
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};