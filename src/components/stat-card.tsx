import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, trend, accent = "primary", className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "primary" | "healthy" | "warning" | "critical" | "info";
  className?: string;
}) {
  const accentMap = {
    primary: "from-primary/20 to-primary/5 text-primary",
    healthy: "from-healthy/20 to-healthy/5 text-healthy",
    warning: "from-warning/20 to-warning/5 text-warning",
    critical: "from-critical/20 to-critical/5 text-critical",
    info: "from-info/20 to-info/5 text-info",
  }[accent];

  return (
    <div className={cn("glass rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", accentMap)} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</div>
          {trend && <div className="mt-1 text-xs text-muted-foreground">{trend}</div>}
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background/80 backdrop-blur", accentMap.split(" ").pop())}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
