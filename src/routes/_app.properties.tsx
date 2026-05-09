import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin, BedDouble, Bath } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/properties")({ component: PropertiesPage });

function PropertiesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Property removed"); qc.invalidateQueries({ queryKey: ["properties"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="All the flats in your portfolio."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Add property</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New property</DialogTitle></DialogHeader>
              <PropertyForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["properties"] }); }} />
            </DialogContent>
          </Dialog>
        }
      />

      {data?.length === 0 && <EmptyState />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <Card key={p.id} className="group overflow-hidden transition-shadow hover:shadow-elegant">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.address}{p.unit_number ? ` · ${p.unit_number}` : ""}
                  </p>
                </div>
                <Badge variant={p.status === "occupied" ? "default" : "secondary"}>{p.status}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {p.bedrooms}</span>
                <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {p.bathrooms}</span>
                <span className="ml-auto font-display text-base font-semibold text-foreground">${Number(p.monthly_rent).toLocaleString()}/mo</span>
              </div>
              {p.notes && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.notes}</p>}
              <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center">
      <h3 className="font-display text-lg font-semibold">No properties yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Add your first apartment to get started.</p>
    </div>
  );
}

function PropertyForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    name: "", address: "", unit_number: "", bedrooms: 1, bathrooms: 1,
    monthly_rent: 0, status: "vacant", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("properties").insert({ ...form, owner_id: u.user!.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Property added");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Address"><Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit #"><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Bedrooms"><Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: +e.target.value })} /></Field>
        <Field label="Bathrooms"><Input type="number" min={0} step={0.5} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: +e.target.value })} /></Field>
        <Field label="Rent ($)"><Input type="number" min={0} value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: +e.target.value })} /></Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Save property"}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
