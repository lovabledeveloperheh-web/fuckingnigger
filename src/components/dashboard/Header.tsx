import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Cloud, Search, LogOut, User, Menu, X, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export const Header = ({ searchQuery, onSearchChange, onMenuToggle, isMenuOpen }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/40">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Logo & Menu Toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl"
            onClick={onMenuToggle}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-brand">
              <Cloud className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline tracking-tight">CloudVault</span>
          </div>

          {/* Home Button - show when not on home */}
          {!isHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="ml-2 rounded-xl"
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl mx-4 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-11 rounded-xl input-premium"
            />
          </div>
        </div>

        {/* Right: User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-secondary/80">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarFallback className="rounded-xl gradient-brand text-primary-foreground font-semibold">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg mb-2">
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarFallback className="rounded-xl gradient-brand text-primary-foreground text-sm font-semibold">
                  {user?.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{user?.email}</span>
                <span className="text-xs text-muted-foreground">Personal Account</span>
              </div>
            </div>
            <DropdownMenuItem className="rounded-lg h-10">
              <User className="w-4 h-4 mr-3" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem onClick={signOut} className="text-destructive rounded-lg h-10">
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 h-11 rounded-xl input-premium"
          />
        </div>
      </div>
    </header>
  );
};
