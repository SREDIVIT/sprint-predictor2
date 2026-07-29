import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/mock-data";

const map: Record<HealthStatus, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  healthy: { label: "Healthy", dot: "bg-healthy", bg: "bg-healthy/10", text: "text-healthy", ring: "ring-healthy/30" },
  warning: { label: "Warning", dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", ring: "ring-warning/30" },
  critical: { label: "Critical", dot: "bg-critical", bg: "bg-critical/10", text: "text-critical", ring: "ring-critical/30" },
};

export function HealthBadge({ status, className }: { status: HealthStatus; className?: string }) {
  const c = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", c.bg, c.text, c.ring, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", c.dot)} />
      {c.label}
    </span>
  );
}

export function healthColorClass(status: HealthStatus) {
  return map[status];
}
