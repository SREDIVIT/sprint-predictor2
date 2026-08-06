import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Bell, CheckCircle2, Sparkles, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
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
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "success" | "info">("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Error loading alerts", err);
      toast.error("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchNotifications();
    }
  }, [user]);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const handleMarkRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      // Update locally
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      toast.success("Alert marked reviewed");
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const filteredList = notifications.filter((n) => filter === "all" || n.type === filter);

  const counts = {
    all: notifications.length,
    critical: notifications.filter((n) => n.type === "critical").length,
    warning: notifications.filter((n) => n.type === "warning").length,
    success: notifications.filter((n) => n.type === "success").length,
    info: notifications.filter((n) => n.type === "info").length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Alert Center
            </div>
            <h1 className="font-display text-4xl font-bold mt-1 flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" /> Alerts
            </h1>
            <p className="text-muted-foreground mt-1">AI-generated alerts triggered by sprint forecasts and story updates.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "critical", "warning", "success", "info"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize",
                filter === k ? "gradient-primary text-white border-transparent shadow-md" : "hover:bg-accent bg-background/50",
              )}
            >
              {k} <span className="ml-1.5 opacity-70">{counts[k]}</span>
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading alerts center...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center max-w-md mx-auto">
            <Bell className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">Clean Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are no active alerts in this category right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {filteredList.map((n) => {
              const emoji = n.type === "critical" ? "🔴" : (n.type === "warning" ? "🟡" : (n.type === "success" ? "🟢" : "🔵"));
              const accent = n.type === "critical" ? "border-l-critical" : (n.type === "warning" ? "border-l-warning" : (n.type === "success" ? "border-l-healthy" : "border-l-primary"));
              
              return (
                <div key={n.id} className={cn("glass rounded-2xl p-6 border-l-4 relative overflow-hidden flex flex-col justify-between", accent, n.read && "opacity-60")}>
                  <div className="flex items-start gap-4">
                    <span className="text-lg shrink-0 mt-0.5">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                          n.type === "critical" ? "text-critical bg-critical/10 border-critical/20" :
                          (n.type === "warning" ? "text-warning bg-warning/10 border-warning/20" :
                           (n.type === "success" ? "text-healthy bg-healthy/10 border-healthy/20" : "text-primary bg-primary/10 border-primary/20"))
                        )}>
                          {n.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold">{n.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.message}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button
                      size="sm"
                      disabled={n.read}
                      className="gradient-primary text-white h-9"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> {n.read ? "Reviewed" : "Mark reviewed"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
