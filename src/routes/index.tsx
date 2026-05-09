import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, Wallet, Wrench, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roofly — Run your rentals like a pro" },
      { name: "description", content: "All-in-one rental management for landlords: properties, tenants, leases, rent and maintenance." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="border-b border-border/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">R</div>
            <span className="font-display text-xl font-semibold">Roofly</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/signup"><Button>Get started</Button></Link>
          </div>
        </nav>
      </header>

      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Built for multi-unit landlords
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Run every flat<br/>like a portfolio.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/80">
              Track properties, tenants, leases, rent collection and maintenance — A to Z, in one calm dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Start free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-2 shadow-elegant backdrop-blur">
              <div className="rounded-xl bg-card p-6 text-card-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly income</div>
                    <div className="mt-1 font-display text-3xl font-bold">$12,480</div>
                  </div>
                  <div className="rounded-md bg-success/15 px-2 py-1 text-xs font-medium text-success">+8.2%</div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: "Units", v: "12" },
                    { label: "Occupied", v: "10" },
                    { label: "Open issues", v: "3" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-muted/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                      <div className="mt-0.5 font-display text-xl font-semibold">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-2">
                  {["Apt 4B — Rent received", "Apt 2A — Lease renews soon", "Apt 7C — New maintenance ticket"].map((t) => (
                    <div key={t} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
                      <span>{t}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything you need, nothing you don't.</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">A focused toolkit to keep every apartment profitable and every tenant happy.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, t: "Properties & units", d: "Catalog every flat with rent, status and notes." },
            { icon: Users, t: "Tenants", d: "Centralize contact info and history." },
            { icon: Wallet, t: "Rent tracking", d: "Schedule, mark paid, monitor balances." },
            { icon: Wrench, t: "Maintenance", d: "Log issues by priority and resolve fast." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elegant">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Roofly. Built for owners who care.
      </footer>
    </div>
  );
}
