'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AddExpensePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/add-expense');
  }, [router]);

  return null;
}