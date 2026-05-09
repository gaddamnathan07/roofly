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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const priorityTone: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/_app/maintenance")({ component: MaintenancePage });

function MaintenancePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, properties(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("maintenance_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("maintenance_requests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["maintenance"] }); },
  });

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Track issues from report to resolution."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> New request</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New maintenance request</DialogTitle></DialogHeader>
              <MaintForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["maintenance"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-3">
        {data?.map((m: any) => (
          <Card key={m.id} className="group">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold">{m.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${priorityTone[m.priority] ?? priorityTone.medium}`}>{m.priority}</span>
                  <Badge variant={m.status === "resolved" ? "secondary" : "default"}>{m.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.properties?.name}</p>
                {m.description && <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Select value={m.status} onValueChange={(v) => setStatus.mutate({ id: m.id, status: v })}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <h3 className="font-display text-lg font-semibold">No requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">All clear — log an issue when something needs fixing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MaintForm({ onDone }: { onDone: () => void }) {
  const { data: properties } = useQuery({ queryKey: ["properties"], queryFn: async () => (await supabase.from("properties").select("id,name")).data ?? [] });
  const [form, setForm] = useState({ property_id: "", title: "", description: "", priority: "medium", status: "open" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id) return toast.error("Select a property");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("maintenance_requests").insert({ ...form, owner_id: u.user!.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Request logged");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Property</Label>
        <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
          <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
          <SelectContent>{properties?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" disabled={saving}>{saving ? "Saving…" : "Log request"}</Button>
    </form>
  );
}
