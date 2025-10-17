'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome as Home, Users, Plus, Target, User, Settings, Menu, X, DollarSign, LogOut, Receipt } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Rooms', href: '/rooms' },
  { icon: Receipt, label: 'My Expenses', href: '/expenses' },
  { icon: Plus, label: 'Add Expense', href: '/add-expense' },
  { icon: Target, label: 'Goals', href: '/goals' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed left-0 top-0 z-40 h-screen bg-card border-r border-border hidden md:flex flex-col"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-2xl bg-primary flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">SplitlyFi</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors relative',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className={cn('flex items-center gap-2', isCollapsed ? 'justify-center' : 'justify-between')}>
        
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 flex-1 justify-center"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.photoURL || ''} />
                    <AvatarFallback className="text-xs">
                      {(profile?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm leading-tight">
                    <p className="font-medium truncate max-w-[140px]">{profile?.displayName || user?.email || 'User'}</p>
                    <p className="text-muted-foreground text-xs">Free Plan</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={async () => { await signOut(); router.push('/auth/login'); }}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}