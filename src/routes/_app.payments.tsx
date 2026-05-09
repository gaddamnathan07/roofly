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
import { Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/payments")({ component: PaymentsPage });

function PaymentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, leases(properties(name), tenants(full_name))")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Marked paid"); qc.invalidateQueries({ queryKey: ["payments"] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("payments").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["payments"] }); },
  });

  const totalDue = (data ?? []).filter((p: any) => p.status !== "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`Outstanding balance: $${totalDue.toLocaleString()}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Add payment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New payment</DialogTitle></DialogHeader>
              <PaymentForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["payments"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead><TableHead>Tenant</TableHead>
              <TableHead>Due</TableHead><TableHead>Amount</TableHead>
              <TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((p: any) => {
              const overdue = p.status !== "paid" && new Date(p.due_date) < new Date();
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.leases?.properties?.name}</TableCell>
                  <TableCell>{p.leases?.tenants?.full_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.due_date}</TableCell>
                  <TableCell>${Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "paid" ? "secondary" : overdue ? "destructive" : "default"}>
                      {p.status === "paid" ? "paid" : overdue ? "overdue" : "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    {p.status !== "paid" && (
                      <Button size="sm" variant="ghost" onClick={() => markPaid.mutate(p.id)}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {data?.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No payments yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PaymentForm({ onDone }: { onDone: () => void }) {
  const { data: leases } = useQuery({
    queryKey: ["leases-min"],
    queryFn: async () => (await supabase.from("leases").select("id,monthly_rent,properties(name),tenants(full_name)").eq("status", "active")).data ?? [],
  });
  const [form, setForm] = useState({ lease_id: "", amount: 0, due_date: new Date().toISOString().slice(0, 10), status: "pending" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lease_id) return toast.error("Select a lease");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({ ...form, owner_id: u.user!.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Payment added");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Lease</Label>
        <Select value={form.lease_id} onValueChange={(v) => {
          const l: any = leases?.find((x: any) => x.id === v);
          setForm({ ...form, lease_id: v, amount: l ? Number(l.monthly_rent) : form.amount });
        }}>
          <SelectTrigger><SelectValue placeholder="Select lease" /></SelectTrigger>
          <SelectContent>
            {leases?.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.properties?.name} — {l.tenants?.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Amount</Label><Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent>
        </Select>
      </div>
      <Button className="w-full" disabled={saving}>{saving ? "Saving…" : "Save payment"}</Button>
    </form>
  );
}
