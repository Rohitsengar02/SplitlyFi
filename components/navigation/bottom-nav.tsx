'use client';

import { Chrome as Home, Users, Plus, Target, User, Receipt } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard', color: 'from-purple-500 to-pink-500' },
  { icon: Users, label: 'Rooms', href: '/rooms', color: 'from-blue-500 to-cyan-500' },
  { icon: Receipt, label: 'Expenses', href: '/expenses', color: 'from-orange-500 to-red-500' },
  { icon: Target, label: 'Goals', href: '/goals', color: 'from-green-500 to-emerald-500' },
  { icon: User, label: 'Profile', href: '/profile', color: 'from-indigo-500 to-purple-500' },
];

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
  },
  animate: (isActive: boolean) => ({
    gap: isActive ? "0.5rem" : 0,
    paddingLeft: isActive ? "1rem" : "0.5rem",
    paddingRight: isActive ? "1rem" : "0.5rem",
  }),
};

const labelVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.05, type: "spring" as const, bounce: 0, duration: 0.5 };

export function BottomNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Backdrop Blur Container */}
      <div className="relative">
        {/* Gradient Border Top */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        {/* Main Nav Container */}
        <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-border/50 shadow-2xl">
          <div className="px-2 py-3 safe-area-bottom">
            <div className="flex items-center justify-center gap-1 max-w-md mx-auto">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                  >
                    <motion.div
                      variants={buttonVariants}
                      initial={false}
                      animate="animate"
                      custom={isActive}
                      transition={transition}
                      className="relative"
                    >
                      {/* Active Background Glow */}
                      <AnimatePresence>
                        {isActive && (
                          <>
                            <motion.div
                              layoutId="bottomNavGlow"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                'absolute -inset-1 rounded-2xl blur-lg opacity-50',
                                `bg-gradient-to-br ${item.color}`
                              )}
                            />
                            <motion.div
                              layoutId="bottomNavActive"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ type: 'spring', duration: 0.5 }}
                              className={cn(
                                'absolute inset-0 rounded-2xl',
                                `bg-gradient-to-br ${item.color}`
                              )}
                            />
                          </>
                        )}
                      </AnimatePresence>

                      {/* Button Content */}
                      <div
                        className={cn(
                          'relative flex items-center rounded-2xl px-3 py-2.5 transition-all duration-300',
                          isActive
                            ? 'shadow-lg'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-6 w-6 transition-all duration-300 relative z-10 shrink-0',
                            isActive ? 'text-white' : 'text-muted-foreground'
                          )}
                        />
                        
                        {/* Expandable Label */}
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.span
                              variants={labelVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={transition}
                              className={cn(
                                'overflow-hidden whitespace-nowrap text-sm font-semibold relative z-10',
                                'text-white'
                              )}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Safe Area for iOS */}
        <div className="h-safe-area-inset-bottom bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl" />
      </div>
    </motion.nav>
  );
}