import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { HealthBadge } from "@/components/health-badge";
import { alerts, type AlertItem } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Bell, CheckCircle2, Eye, UserPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "AI Alerts · SprintSense AI" },
      { name: "description", content: "AI alert center: healthy, warning, and critical signals with recommended actions." },
      { property: "og:title", content: "AI Alerts · SprintSense AI" },
      { property: "og:description", content: "AI alert center with recommended actions." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const user = useAuth();
  const [filter, setFilter] = useState<"all" | AlertItem["level"]>("all");
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const list = alerts.filter((a) => filter === "all" || a.level === filter);
  const counts = {
    all: alerts.length,
    healthy: alerts.filter((a) => a.level === "healthy").length,
    warning: alerts.filter((a) => a.level === "warning").length,
    critical: alerts.filter((a) => a.level === "critical").length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Alert Center
            </div>
            <h1 className="font-display text-4xl font-bold mt-1 flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" /> Alerts
            </h1>
            <p className="text-muted-foreground mt-1">AI-generated alerts triggered by developer story updates.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "critical", "warning", "healthy"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize",
                filter === k ? "gradient-primary text-white border-transparent shadow-md" : "hover:bg-accent",
              )}
            >
              {k} <span className="ml-1.5 opacity-70">{counts[k]}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {list.map((a) => {
            const isReviewed = reviewed.has(a.id);
            const emoji = a.level === "critical" ? "🔴" : a.level === "warning" ? "🟡" : "🟢";
            const accent = a.level === "critical" ? "border-l-critical" : a.level === "warning" ? "border-l-warning" : "border-l-healthy";
            return (
              <div key={a.id} className={cn("glass rounded-2xl p-6 border-l-4 relative overflow-hidden", accent, isReviewed && "opacity-60")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{emoji}</span>
                      <HealthBadge status={a.level} />
                      <span className="text-xs text-muted-foreground">{a.createdAt}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Story: <span className="text-foreground font-medium">{a.storyTitle}</span> · Developer: <span className="text-foreground font-medium">{a.developer}</span>
                    </p>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Reasons</div>
                        <ul className="space-y-1 text-sm">
                          {a.reasons.map((r, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{r}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Recommendations</div>
                        <ul className="space-y-1 text-sm">
                          {a.recommendations.map((r, i) => <li key={i} className="flex gap-2"><span className="text-primary">→</span>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5 mr-1.5" /> View story</Button>
                  <Button variant="outline" size="sm"><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Assign developer</Button>
                  <Button
                    size="sm"
                    disabled={isReviewed}
                    className="gradient-primary text-white"
                    onClick={() => { setReviewed((r) => new Set([...r, a.id])); toast.success("Alert marked reviewed"); }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> {isReviewed ? "Reviewed" : "Mark reviewed"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
