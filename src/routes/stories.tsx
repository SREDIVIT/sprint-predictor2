import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { HealthBadge } from "@/components/health-badge";
import { AiAnalysisModal } from "@/components/ai-analysis-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stories, developers, type Story } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Eye, Pencil, Sparkles, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Stories · SprintSense AI" },
      { name: "description", content: "Every sprint story with live AI health scoring and one-click risk analysis." },
      { property: "og:title", content: "Stories · SprintSense AI" },
      { property: "og:description", content: "Sprint stories with live AI health scoring." },
    ],
  }),
  component: StoriesPage,
});

const priorityColor = (p: string) =>
  p === "Critical" ? "bg-critical/10 text-critical" :
  p === "High" ? "bg-warning/10 text-warning" :
  p === "Medium" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground";

function StoriesPage() {
  const user = useAuth();
  const [analyze, setAnalyze] = useState<Story | null>(null);
  const [q, setQ] = useState("");
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  const filtered = stories.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Story Management
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Stories</h1>
            <p className="text-muted-foreground mt-1">{stories.length} stories · AI classifies each as Healthy, Warning, or Critical.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search stories..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-56" />
            </div>
            <CreateStoryDialog />
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Story</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="w-40">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Health</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const dev = developers.find((d) => d.id === s.developerId);
                return (
                  <TableRow key={s.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium max-w-xs truncate">{s.title}</TableCell>
                    <TableCell className="text-sm">{dev?.name}</TableCell>
                    <TableCell><span className={cn("text-xs font-semibold px-2 py-1 rounded-full", priorityColor(s.priority))}>{s.priority}</span></TableCell>
                    <TableCell>{s.points}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.progress} className="h-1.5" />
                        <span className="text-xs font-semibold w-8">{s.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.status}</TableCell>
                    <TableCell><HealthBadge status={s.health} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="View"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setAnalyze(s)} className="gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <AiAnalysisModal story={analyze} open={!!analyze} onOpenChange={(v) => !v && setAnalyze(null)} />
    </AppShell>
  );
}

function CreateStoryDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-white shadow-lg glow">
          <Plus className="h-4 w-4 mr-1.5" /> Create Story
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create story</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); setOpen(false); }} className="space-y-4">
          <div><Label>Story title</Label><Input placeholder="e.g. Refactor checkout webhook" className="mt-1.5" /></div>
          <div><Label>Description</Label><Textarea placeholder="Details, acceptance criteria..." rows={3} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select defaultValue="High"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["Low", "Medium", "High", "Critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Story points</Label><Input type="number" defaultValue={5} className="mt-1.5" /></div>
            <div><Label>Estimated hours</Label><Input type="number" defaultValue={16} className="mt-1.5" /></div>
            <div><Label>Dependencies</Label><Input placeholder="STORY-42" className="mt-1.5" /></div>
            <div>
              <Label>Assign developer</Label>
              <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{developers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sprint</Label>
              <Select defaultValue="24"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="24">Sprint 24</SelectItem><SelectItem value="25">Sprint 25</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full gradient-primary text-white h-11">Create story</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
