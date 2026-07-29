import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { HealthBadge } from "@/components/health-badge";
import { sprint, stats, stories } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Calendar, Target, Sparkles, ShieldCheck, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export const Route = createFileRoute("/sprint")({
  head: () => ({
    meta: [
      { title: "Active Sprint · SprintSense AI" },
      { name: "description", content: "Track the active sprint with AI-forecasted success probability and per-story health." },
      { property: "og:title", content: "Active Sprint · SprintSense AI" },
      { property: "og:description", content: "AI-forecasted success probability for the active sprint." },
    ],
  }),
  component: SprintPage,
});

function SprintPage() {
  const user = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  const s = stats();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "var(--gradient-mesh)" }} />
          <div className="relative">
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Active Sprint
            </div>
            <h1 className="font-display text-4xl font-bold mt-2">{sprint.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl flex items-start gap-2">
              <Target className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>{sprint.goal}</span>
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoTile icon={Calendar} label="Duration" value={`${sprint.startDate} → ${sprint.endDate}`} />
              <InfoTile icon={TrendingUp} label="Days elapsed" value={`${sprint.daysElapsed} / ${sprint.daysTotal}`} />
              <InfoTile icon={Target} label="Progress" value={`${sprint.progress}%`} />
              <InfoTile icon={Sparkles} label="Success probability" value={`${sprint.successProbability}%`} highlight />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Sprint progress</span>
                <span className="font-semibold">{sprint.progress}%</span>
              </div>
              <Progress value={sprint.progress} className="h-3" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Healthy" value={s.healthy} icon={ShieldCheck} accent="healthy" />
          <StatCard label="Warning" value={s.warning} icon={AlertTriangle} accent="warning" />
          <StatCard label="Critical" value={s.critical} icon={ShieldAlert} accent="critical" />
          <StatCard label="Success probability" value={`${sprint.successProbability}%`} icon={Sparkles} accent="primary" />
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Sprint backlog snapshot</h3>
          <div className="space-y-3">
            {stories.map((st) => (
              <div key={st.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors">
                <HealthBadge status={st.health} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{st.title}</div>
                  <div className="text-xs text-muted-foreground">{st.status} · {st.points} pts</div>
                </div>
                <div className="w-32 hidden sm:block">
                  <Progress value={st.progress} className="h-1.5" />
                </div>
                <div className="text-sm font-semibold w-10 text-right">{st.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InfoTile({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`font-display text-xl font-bold mt-1.5 ${highlight ? "text-gradient" : ""}`}>{value}</div>
    </div>
  );
}
