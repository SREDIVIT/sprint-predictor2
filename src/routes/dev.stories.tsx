import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HealthBadge } from "@/components/health-badge";
import { AiAnalysisModal } from "@/components/ai-analysis-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stories, type Story } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { MessageSquare, Bug, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dev/stories")({
  head: () => ({
    meta: [
      { title: "My Stories · SprintSense AI" },
      { name: "description", content: "Update progress on your stories. AI runs a live analysis after every change." },
      { property: "og:title", content: "My Stories · SprintSense AI" },
      { property: "og:description", content: "AI runs a live analysis after every story update." },
    ],
  }),
  component: DevStoriesPage,
});

const priorityColor = (p: string) =>
  p === "Critical" ? "bg-critical/10 text-critical" :
  p === "High" ? "bg-warning/10 text-warning" :
  p === "Medium" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground";

function DevStoriesPage() {
  const user = useAuth();
  const [editing, setEditing] = useState<Story | null>(null);
  const [analyze, setAnalyze] = useState<Story | null>(null);
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  const mine = stories.filter((s) => s.developerId === "d1");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Your Sprint
          </div>
          <h1 className="font-display text-4xl font-bold mt-1">My stories</h1>
          <p className="text-muted-foreground mt-1">Update progress · AI will re-analyze automatically.</p>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Story</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-40">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bugs</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium max-w-xs truncate">{s.title}</TableCell>
                  <TableCell><span className={cn("text-xs font-semibold px-2 py-1 rounded-full", priorityColor(s.priority))}>{s.priority}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.progress} className="h-1.5" />
                      <span className="text-xs font-semibold w-8">{s.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm"><HealthBadge status={s.health} /></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-sm"><Bug className="h-3.5 w-3.5" /> {s.bugs}</span></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" /> {Math.floor(Math.random() * 6) + 1}</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="gradient-primary text-white" onClick={() => setEditing(s)}>Update</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <UpdateStoryDialog story={editing} onClose={() => setEditing(null)} onAnalyze={(s) => { setEditing(null); setAnalyze(s); }} />
      <AiAnalysisModal story={analyze} open={!!analyze} onOpenChange={(v) => !v && setAnalyze(null)} />
    </AppShell>
  );
}

function UpdateStoryDialog({ story, onClose, onAnalyze }: { story: Story | null; onClose: () => void; onAnalyze: (s: Story) => void }) {
  const [progress, setProgress] = useState(story?.progress ?? 0);
  const [status, setStatus] = useState(story?.status ?? "In Progress");
  const [bugs, setBugs] = useState(story?.bugs ?? 0);

  if (!story) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Story updated · running AI analysis...");
    setTimeout(() => onAnalyze({ ...story, progress, bugs, status: status as any }), 600);
  };

  return (
    <Dialog open={!!story} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-tight">Update: {story.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Progress</Label>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} max={100} step={5} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["To Do", "In Progress", "In Review", "Done", "Blocked"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bug count</Label>
              <Input type="number" value={bugs} onChange={(e) => setBugs(Number(e.target.value))} className="mt-1.5" />
            </div>
            <div><Label>Time spent today (h)</Label><Input type="number" defaultValue={4} className="mt-1.5" /></div>
          </div>
          <div><Label>Comments</Label><Textarea rows={3} placeholder="What's the latest?" className="mt-1.5" /></div>
          <Button type="submit" className="w-full gradient-primary text-white h-11">
            <Sparkles className="h-4 w-4 mr-1.5" /> Update & run AI analysis
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
