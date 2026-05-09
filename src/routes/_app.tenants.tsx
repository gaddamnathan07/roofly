import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tenants")({ component: TenantsPage });

function TenantsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tenant removed"); qc.invalidateQueries({ queryKey: ["tenants"] }); },
  });

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle="People renting your spaces."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Add tenant</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New tenant</DialogTitle></DialogHeader>
              <TenantForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["tenants"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((t) => (
          <Card key={t.id} className="group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold">{t.full_name}</h3>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {t.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{t.email}</div>}
                    {t.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{t.phone}</div>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => del.mutate(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {t.notes && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{t.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      {data?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="font-display text-lg font-semibold">No tenants yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add tenants to start tracking leases.</p>
        </div>
      )}
    </div>
  );
}

function TenantForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("tenants").insert({ ...form, owner_id: u.user!.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tenant added");
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5"><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <Button className="w-full" disabled={saving}>{saving ? "Saving…" : "Save tenant"}</Button>
    </form>
  );
}
