import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leases")({ component: LeasesPage });

function LeasesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["leases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("*, properties(name), tenants(full_name)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("leases").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Lease removed"); qc.invalidateQueries({ queryKey: ["leases"] }); },
  });

  return (
    <div>
      <PageHeader
        title="Leases"
        subtitle="Active and past rental agreements."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> New lease</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New lease</DialogTitle></DialogHeader>
              <LeaseForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["leases"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead><TableHead>Tenant</TableHead>
              <TableHead>Period</TableHead><TableHead>Rent</TableHead>
              <TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.properties?.name}</TableCell>
                <TableCell>{l.tenants?.full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.start_date} → {l.end_date}</TableCell>
                <TableCell>${Number(l.monthly_rent).toLocaleString()}</TableCell>
                <TableCell><Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge></TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No leases yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LeaseForm({ onDone }: { onDone: () => void }) {
  const { data: properties } = useQuery({ queryKey: ["properties"], queryFn: async () => (await supabase.from("properties").select("id,name,monthly_rent")).data ?? [] });
  const { data: tenants } = useQuery({ queryKey: ["tenants"], queryFn: async () => (await supabase.from("tenants").select("id,full_name")).data ?? [] });

  const [form, setForm] = useState({ property_id: "", tenant_id: "", start_date: "", end_date: "", monthly_rent: 0, deposit: 0, status: "active" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id || !form.tenant_id) return toast.error("Select property and tenant");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("leases").insert({ ...form, owner_id: u.user!.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lease created");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Property</Label>
        <Select value={form.property_id} onValueChange={(v) => {
          const p = properties?.find((x: any) => x.id === v);
          setForm({ ...form, property_id: v, monthly_rent: p ? Number(p.monthly_rent) : form.monthly_rent });
        }}>
          <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
          <SelectContent>{properties?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Tenant</Label>
        <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
          <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
          <SelectContent>{tenants?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Start</Label><Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>End</Label><Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Monthly rent</Label><Input type="number" min={0} value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Deposit</Label><Input type="number" min={0} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: +e.target.value })} /></div>
      </div>
      <Button className="w-full" disabled={saving}>{saving ? "Saving…" : "Create lease"}</Button>
    </form>
  );
}
