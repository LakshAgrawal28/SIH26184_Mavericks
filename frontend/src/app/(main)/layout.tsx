import AppShell from "@/components/AppShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-console min-h-screen bg-background text-foreground">
      <AppShell>{children}</AppShell>
    </div>
  );
}
