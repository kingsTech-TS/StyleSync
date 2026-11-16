import { AdminNav } from "@/components/admin/admin-nav";
import { VizStyles } from "@/components/admin/charts";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/layout/guards";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth admin>
      <AppShell>
        <VizStyles />
        <div className="viz-root">
          <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">Admin</p>
          <AdminNav />
          {children}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
