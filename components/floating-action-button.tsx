'use client';

import { Plus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function FloatingActionButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on add-expense page itself
  if (pathname === '/add-expense') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-20 right-6 z-50 md:hidden"
      >
        <Button
          onClick={() => router.push('/add-expense')}
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
