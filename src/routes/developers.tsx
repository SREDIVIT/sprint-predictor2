import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HealthBadge } from "@/components/health-badge";
import { Progress } from "@/components/ui/progress";
import { developers } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Sparkles, Trophy, ListChecks, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Developers · SprintSense AI" },
      { name: "description", content: "Team roster with AI-scored performance, workload, and current story health." },
      { property: "og:title", content: "Developers · SprintSense AI" },
      { property: "og:description", content: "Team roster with AI-scored performance and workload." },
    ],
  }),
  component: DevelopersPage,
});

function DevelopersPage() {
  const user = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Team
          </div>
          <h1 className="font-display text-4xl font-bold mt-1">Developers</h1>
          <p className="text-muted-foreground mt-1">{developers.length} developers · AI health updated after each story change.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {developers.map((d) => (
            <div key={d.id} className="glass rounded-2xl p-6 group hover:-translate-y-1 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-2xl gradient-primary text-white grid place-items-center font-bold text-lg shadow-lg">
                  {d.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-bold truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.role}</div>
                  <div className="mt-2"><HealthBadge status={d.health} /></div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat icon={ListChecks} label="Assigned" value={d.assigned} />
                <MiniStat icon={CheckCircle2} label="Completed" value={d.completed} />
              </div>

              <div className="mt-4">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Current story</div>
                <div className="text-sm font-medium truncate">{d.currentStory}</div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-primary" /> Performance</span>
                  <span className="font-semibold">{d.performance}</span>
                </div>
                <Progress value={d.performance} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function MiniStat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider"><Icon className="h-3 w-3" /> {label}</div>
      <div className="font-display text-xl font-bold mt-0.5">{value}</div>
    </div>
  );
}
