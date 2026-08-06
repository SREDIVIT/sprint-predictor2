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
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { MessageSquare, Bug, Sparkles, Folder } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

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
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [analyze, setAnalyze] = useState<any | null>(null);

  const fetchMyStories = async () => {
    if (!user) return;
    try {
      const res = await api.get("/api/stories");
      const mine = res.data.filter((s: any) => s.developer_id === user.id);
      setStories(mine);
    } catch (err) {
      console.error("Error loading dev stories", err);
      toast.error("Failed to load your stories.");
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchMyStories().finally(() => setLoading(false));
    }
  }, [user]);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const handleUpdateComplete = (updatedStory: any) => {
    setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
    setAnalyze(updatedStory);
  };

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

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading assigned stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Stories Assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have any user stories assigned in this active sprint.
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead>Story</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="w-40">Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bugs</TableHead>
                  <TableHead>AI Health</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((s) => {
                  const progress = s.status === "Done" ? 100 : (s.status === "In Review" ? 90 : (s.status === "In Progress" ? 50 : 0));
                  return (
                    <TableRow key={s.id} className="hover:bg-accent/30 border-b border-border/40">
                      <TableCell className="font-medium max-w-xs truncate">{s.title}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", priorityColor(s.priority))}>
                          {s.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5" />
                          <span className="text-xs font-semibold w-8">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{s.status}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border">
                          <Bug className="h-3.5 w-3.5 text-destructive" /> {s.bugs}
                        </span>
                      </TableCell>
                      <TableCell><HealthBadge status={s.health} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="gradient-primary text-white" onClick={() => setEditing(s)}>
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {editing && (
        <UpdateStoryDialog
          story={editing}
          onClose={() => setEditing(null)}
          onUpdateComplete={handleUpdateComplete}
        />
      )}
      <AiAnalysisModal story={analyze} open={!!analyze} onOpenChange={(v) => !v && setAnalyze(null)} />
    </AppShell>
  );
}

function UpdateStoryDialog({ story, onClose, onUpdateComplete }: { story: any; onClose: () => void; onUpdateComplete: (s: any) => void }) {
  const [status, setStatus] = useState(story.status);
  const [bugs, setBugs] = useState(story.bugs.toString());
  const [timeSpent, setTimeSpent] = useState("0");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/api/stories/${story.id}`, {
        status,
        bugs: parseInt(bugs) || 0,
        hours_spent: story.hours_spent + (parseFloat(timeSpent) || 0.0)
      });
      toast.success("Story updated · running AI analysis...");
      onUpdateComplete(res.data);
      onClose();
    } catch (err: any) {
      toast.error("Failed to update story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!story} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg glass-strong border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold">Update progress: {story.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["To Do", "In Progress", "In Review", "Done", "Blocked"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bugs">Bug Count</Label>
              <Input
                id="bugs"
                type="number"
                value={bugs}
                onChange={(e) => setBugs(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="time-spent">Add Time Spent Today (Hours)</Label>
              <Input
                id="time-spent"
                type="number"
                step="0.5"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full gradient-primary text-white h-11 font-semibold mt-2">
            <Sparkles className="h-4 w-4 mr-1.5" /> {loading ? "Updating..." : "Update & Run AI Analysis"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
