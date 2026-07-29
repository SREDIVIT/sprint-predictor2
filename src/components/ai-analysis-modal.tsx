import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { HealthBadge } from "./health-badge";
import type { Story } from "@/lib/mock-data";

export function AiAnalysisModal({ story, open, onOpenChange }: { story: Story | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!story) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-strong border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> AI Analysis Complete
          </div>
          <DialogTitle className="font-display text-2xl leading-tight">{story.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <HealthBadge status={story.health} />
            <div className="text-xs text-muted-foreground">Assigned developer analysis</div>
          </div>

          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Risk of missing deadline</span>
              <span className="font-bold text-lg">{story.riskPercent}%</span>
            </div>
            <Progress value={story.riskPercent} className="h-2" />

            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Completion probability</span>
              <span className="font-bold text-lg text-healthy">{story.completionProbability}%</span>
            </div>
            <Progress value={story.completionProbability} className="h-2" />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Reasons
            </div>
            <ul className="space-y-1.5">
              {story.reasons.map((r, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary">•</span>{r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl gradient-primary text-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest opacity-80">AI Recommendation</div>
            <div className="mt-1 text-sm font-medium">{story.recommendation}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
