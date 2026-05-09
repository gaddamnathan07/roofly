import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet, Wrench, TrendingUp, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [props, tenants, leases, payments, maint] = await Promise.all([
        supabase.from("properties").select("id,status,monthly_rent"),
        supabase.from("tenants").select("id"),
        supabase.from("leases").select("id,status,monthly_rent"),
        supabase.from("payments").select("id,amount,status,due_date,paid_date"),
        supabase.from("maintenance_requests").select("id,status,priority,title,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        properties: props.data ?? [],
        tenants: tenants.data ?? [],
        leases: leases.data ?? [],
        payments: payments.data ?? [],
        maintenance: maint.data ?? [],
      };
    },
  });

  const properties = data?.properties ?? [];
  const occupied = properties.filter((p) => p.status === "occupied").length;
  const monthlyIncome = (data?.leases ?? []).filter((l) => l.status === "active").reduce((s, l) => s + Number(l.monthly_rent), 0);
  const outstanding = (data?.payments ?? []).filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0);
  const openIssues = (data?.maintenance ?? []).filter((m) => m.status !== "resolved").length;

  const stats = [
    { label: "Properties", value: properties.length, icon: Building2, hint: `${occupied} occupied` },
    { label: "Tenants", value: (data?.tenants ?? []).length, icon: Users },
    { label: "Monthly income", value: `$${monthlyIncome.toLocaleString()}`, icon: TrendingUp },
    { label: "Outstanding", value: `$${outstanding.toLocaleString()}`, icon: Wallet, alert: outstanding > 0 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A snapshot of your portfolio." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.alert ? "text-destructive" : "text-accent"}`} />
              </div>
              <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
              {s.hint && <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Wrench className="h-4 w-4" /> Recent maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.maintenance ?? []).length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
            {(data?.maintenance ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="truncate">{m.title}</span>
                <Badge variant={m.status === "resolved" ? "secondary" : "default"}>{m.status}</Badge>
              </div>
            ))}
            <Link to="/maintenance" className="mt-2 block text-xs text-primary hover:underline">View all →</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="h-4 w-4" /> Quick status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Open issues" value={String(openIssues)} />
            <Row label="Active leases" value={String((data?.leases ?? []).filter(l => l.status === "active").length)} />
            <Row label="Vacant units" value={String(properties.filter(p => p.status === "vacant").length)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-display font-semibold">{value}</span>
    </div>
  );
}
