import { BottomNav } from '@/components/navigation/bottom-nav';
import { Sidebar } from '@/components/navigation/sidebar';
import { FloatingActionButton } from '@/components/floating-action-button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-[280px] pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <FloatingActionButton />
    </div>
  );
}