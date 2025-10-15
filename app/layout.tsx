import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SplitlyFi - Collaborative Expense Management',
  description: 'Track expenses, achieve goals, and manage finances together with friends and family.',
  keywords: ['expense tracking', 'financial goals', 'split bills', 'collaborative finance'],
  authors: [{ name: 'SplitlyFi' }],
  openGraph: {
    title: 'SplitlyFi - Collaborative Expense Management',
    description: 'Track expenses, achieve goals, and manage finances together with friends and family.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}