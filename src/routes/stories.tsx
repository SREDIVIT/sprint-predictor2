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
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Eye, Pencil, Sparkles, Plus, Search, Trash2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Backlog Stories · SprintSense AI" },
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
  
  // Backlog and state contexts
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [sprints, setSprints] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyze, setAnalyze] = useState<any | null>(null);

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);

  // Form states
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDesc, setStoryDesc] = useState("");
  const [storyPriority, setStoryPriority] = useState("Medium");
  const [storyPoints, setStoryPoints] = useState("3");
  const [storyEstHours, setStoryEstHours] = useState("12");
  const [storyDevId, setStoryDevId] = useState("");
  const [storySprintId, setStorySprintId] = useState("");
  const [storyStatus, setStoryStatus] = useState("To Do");
  const [storyBugs, setStoryBugs] = useState("0");

  const loadData = async () => {
    try {
      const projRes = await api.get("/api/projects");
      setProjects(projRes.data);
      
      const devRes = await api.get("/api/developers");
      setDevelopers(devRes.data.filter((d: any) => !d.is_disabled));
      
      if (projRes.data.length > 0) {
        const defaultProjId = selectedProjectId || projRes.data[0].id.toString();
        setSelectedProjectId(defaultProjId);
        await loadStoriesAndSprints(defaultProjId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const loadStoriesAndSprints = async (projId: string) => {
    try {
      const sprintRes = await api.get("/api/sprints", { params: { project_id: projId } });
      setSprints(sprintRes.data);

      const storiesRes = await api.get("/api/stories", { params: { project_id: projId } });
      setStories(storiesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadData();
    }
  }, [user]);

  const handleProjectChange = (val: string) => {
    setSelectedProjectId(val);
    setLoading(true);
    loadStoriesAndSprints(val);
  };

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  // Create Backlog Story
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle) {
      toast.error("Story title is required.");
      return;
    }
    try {
      await api.post("/api/stories", {
        title: storyTitle,
        description: storyDesc,
        priority: storyPriority,
        points: parseInt(storyPoints),
        project_id: parseInt(selectedProjectId),
        sprint_id: storySprintId ? parseInt(storySprintId) : null,
        developer_id: storyDevId ? parseInt(storyDevId) : null,
        hours_estimated: parseFloat(storyEstHours) || 0.0,
        bugs: parseInt(storyBugs) || 0,
        status: "To Do"
      });
      toast.success("User story created successfully!");
      setCreateOpen(false);
      
      // Reset form
      setStoryTitle("");
      setStoryDesc("");
      setStoryPriority("Medium");
      setStoryPoints("3");
      setStoryEstHours("12");
      setStoryDevId("");
      setStorySprintId("");
      setStoryBugs("0");

      loadStoriesAndSprints(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create backlog item.");
    }
  };

  // Edit Story
  const handleEditStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle) return;
    try {
      await api.put(`/api/stories/${selectedStory.id}`, {
        title: storyTitle,
        description: storyDesc,
        priority: storyPriority,
        points: parseInt(storyPoints),
        sprint_id: storySprintId ? parseInt(storySprintId) : null,
        developer_id: storyDevId ? parseInt(storyDevId) : null,
        hours_estimated: parseFloat(storyEstHours) || 0.0,
        status: storyStatus,
        bugs: parseInt(storyBugs) || 0
      });
      toast.success("User story updated!");
      setEditOpen(false);
      loadStoriesAndSprints(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update story.");
    }
  };

  // Delete Story
  const handleDeleteStory = async (storyId: number) => {
    if (!confirm("Are you sure you want to delete this story backlog item?")) return;
    try {
      await api.delete(`/api/stories/${storyId}`);
      toast.success("User story deleted successfully.");
      loadStoriesAndSprints(selectedProjectId);
    } catch (err) {
      toast.error("Failed to delete backlog story.");
    }
  };

  const openEditDialog = (story: any) => {
    setSelectedStory(story);
    setStoryTitle(story.title);
    setStoryDesc(story.description || "");
    setStoryPriority(story.priority);
    setStoryPoints(story.points.toString());
    setStoryEstHours(story.hours_estimated.toString());
    setStoryDevId(story.developer_id ? story.developer_id.toString() : "");
    setStorySprintId(story.sprint_id ? story.sprint_id.toString() : "");
    setStoryStatus(story.status);
    setStoryBugs(story.bugs.toString());
    setEditOpen(true);
  };

  const filtered = stories.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Product Backlog
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Stories</h1>
            <p className="text-muted-foreground mt-1">
              {stories.length} stories in backlog · AI health checks run automatically.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Project:</Label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-56 bg-background/50">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 bg-background/50"
              />
            </div>
            
            {user.role === "scrum" && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-white shadow-lg glow">
                    <Plus className="h-4 w-4 mr-1.5" /> Create Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg glass-strong border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold">Create Story</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateStory} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Story Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Refactor checkout webhook signer"
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="desc">Description & Acceptance Criteria</Label>
                      <Textarea
                        id="desc"
                        placeholder="Define details and validation check criteria..."
                        value={storyDesc}
                        onChange={(e) => setStoryDesc(e.target.value)}
                        className="mt-1.5"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <Label>Priority</Label>
                        <Select value={storyPriority} onValueChange={setStoryPriority}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Low", "Medium", "High", "Critical"].map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="points">Story Points</Label>
                        <Input
                          id="points"
                          type="number"
                          value={storyPoints}
                          onChange={(e) => setStoryPoints(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="est-hours">Est Hours</Label>
                        <Input
                          id="est-hours"
                          type="number"
                          value={storyEstHours}
                          onChange={(e) => setStoryEstHours(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bugs">Active Bugs</Label>
                        <Input
                          id="bugs"
                          type="number"
                          value={storyBugs}
                          onChange={(e) => setStoryBugs(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label>Assign Developer</Label>
                        <Select value={storyDevId} onValueChange={setStoryDevId}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {developers.map((d) => (
                              <SelectItem key={d.id} value={d.id.toString()}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Sprint Target</Label>
                        <Select value={storySprintId} onValueChange={setStorySprintId}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Backlog" />
                          </SelectTrigger>
                          <SelectContent>
                            {sprints.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                      Create Story
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading story backlog...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Backlog Stories</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add user stories to your project backlog to start tracking.
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
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
                  const dev = developers.find((d) => d.id === s.developer_id);
                  // Dynamic progress bar calculation
                  const progress = s.status === "Done" ? 100 : (s.status === "In Review" ? 90 : (s.status === "In Progress" ? 50 : 0));
                  return (
                    <TableRow key={s.id} className="hover:bg-accent/30 border-b border-border/40">
                      <TableCell className="font-medium max-w-xs truncate">{s.title}</TableCell>
                      <TableCell className="text-sm">{dev ? dev.name : "Unassigned"}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", priorityColor(s.priority))}>
                          {s.priority}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{s.points}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5" />
                          <span className="text-xs font-semibold w-8">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{s.status}</TableCell>
                      <TableCell><HealthBadge status={s.health} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(s)}
                            title="Edit Story"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.role === "scrum" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteStory(s.id)}
                              title="Delete Story"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAnalyze(s)}
                            className="gap-1 px-2.5 h-8 border-primary/40 hover:bg-primary/5 hover:text-primary transition-all text-xs"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> Copilot
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Story Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {selectedStory && (
          <DialogContent className="max-w-lg glass-strong border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold">Edit Backlog Story</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditStory} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Story Title</Label>
                <Input
                  id="edit-title"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-desc">Description & Acceptance Criteria</Label>
                <Textarea
                  id="edit-desc"
                  value={storyDesc}
                  onChange={(e) => setStoryDesc(e.target.value)}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <Label>Priority</Label>
                  <Select value={storyPriority} onValueChange={setStoryPriority}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Low", "Medium", "High", "Critical"].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-points">Story Points</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-est-hours">Est Hours</Label>
                  <Input
                    id="edit-est-hours"
                    type="number"
                    value={storyEstHours}
                    onChange={(e) => setStoryEstHours(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-bugs">Active Bugs</Label>
                  <Input
                    id="edit-bugs"
                    type="number"
                    value={storyBugs}
                    onChange={(e) => setStoryBugs(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Assign Developer</Label>
                  <Select value={storyDevId} onValueChange={setStoryDevId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sprint Target</Label>
                  <Select value={storySprintId} onValueChange={setStorySprintId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Backlog" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Backlog</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Status</Label>
                  <Select value={storyStatus} onValueChange={setStoryStatus}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["To Do", "In Progress", "In Review", "Done", "Blocked"].map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                Save Backlog Story Changes
              </Button>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* RAG Story Analysis Modal */}
      <AiAnalysisModal story={analyze} open={!!analyze} onOpenChange={(v) => !v && setAnalyze(null)} />
    </AppShell>
  );
}
