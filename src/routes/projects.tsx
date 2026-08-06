import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Sparkles, Users2, Search, Plus, Trash2, Edit3, UserPlus, UserMinus, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects · SprintSense AI" },
      { name: "description", content: "All projects with live AI health scoring, sprint progress, and team allocation." },
      { property: "og:title", content: "Projects · SprintSense AI" },
      { property: "og:description", content: "All projects with live AI health scoring and team allocation." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const user = useAuth();
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [developersList, setDevelopersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  
  // Selected project state
  const [selectedProj, setSelectedProj] = useState<any>(null);
  
  // Form states
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projColor, setProjColor] = useState("from-violet-500 to-fuchsia-500");
  const [selectedDevId, setSelectedDevId] = useState<string>("");

  const colors = [
    { value: "from-violet-500 to-fuchsia-500", name: "Violet Fusion" },
    { value: "from-sky-500 to-cyan-500", name: "Nimbus Sky" },
    { value: "from-amber-500 to-rose-500", name: "Helio Sunset" },
    { value: "from-emerald-500 to-teal-500", name: "Orbit Emerald" },
  ];

  const fetchProjects = async () => {
    try {
      const res = await api.get("/api/projects");
      setProjectsList(res.data);
      if (selectedProj) {
        const updated = res.data.find((p: any) => p.id === selectedProj.id);
        if (updated) setSelectedProj(updated);
      }
    } catch (err) {
      console.error("Error loading projects", err);
      toast.error("Failed to load projects.");
    }
  };

  const fetchDevelopers = async () => {
    try {
      const res = await api.get("/api/developers");
      setDevelopersList(res.data.filter((d: any) => !d.is_disabled));
    } catch (err) {
      console.error("Error loading developers", err);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchProjects(), fetchDevelopers()]).finally(() => setLoading(false));
    }
  }, [user]);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) {
      toast.error("Project name is required.");
      return;
    }
    try {
      await api.post("/api/projects", {
        name: projName,
        description: projDesc,
        color: projColor,
      });
      toast.success("Project created successfully!");
      setCreateOpen(false);
      // Reset forms
      setProjName("");
      setProjDesc("");
      setProjColor("from-violet-500 to-fuchsia-500");
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create project.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) {
      toast.error("Project name is required.");
      return;
    }
    try {
      await api.put(`/api/projects/${selectedProj.id}`, {
        name: projName,
        description: projDesc,
        color: projColor,
      });
      toast.success("Project updated successfully!");
      setEditOpen(false);
      setSelectedProj(null);
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update project.");
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project? This will delete all associated sprints, stories, and tasks.")) {
      return;
    }
    try {
      await api.delete(`/api/projects/${projectId}`);
      toast.success("Project deleted successfully.");
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete project.");
    }
  };

  const handleAssignMember = async () => {
    if (!selectedDevId) return;
    try {
      await api.post(`/api/projects/${selectedProj.id}/developers`, {
        developer_id: parseInt(selectedDevId),
      });
      toast.success("Developer assigned to project.");
      setSelectedDevId("");
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to assign developer.");
    }
  };

  const handleRemoveMember = async (devId: number) => {
    try {
      await api.delete(`/api/projects/${selectedProj.id}/developers/${devId}`);
      toast.success("Developer removed from project.");
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to remove developer.");
    }
  };

  const openEditDialog = (proj: any) => {
    setSelectedProj(proj);
    setProjName(proj.name);
    setProjDesc(proj.description || "");
    setProjColor(proj.color);
    setEditOpen(true);
  };

  const openMembersDialog = (proj: any) => {
    setSelectedProj(proj);
    setMembersOpen(true);
  };

  const filteredProjects = projectsList.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Portfolio
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Projects</h1>
            <p className="text-muted-foreground mt-1">
              {projectsList.length} active projects · managed by the Scrum team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 bg-background/50"
              />
            </div>
            {user.role === "scrum" && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-white shadow-lg glow">
                    <Plus className="h-4 w-4 mr-1.5" /> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md glass-strong border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold">Create Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Apollo Checkout"
                        value={projName}
                        onChange={(e) => setProjName(e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        placeholder="Provide details about the project scope..."
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        className="mt-1.5"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Theme Color</Label>
                      <Select value={projColor} onValueChange={setProjColor}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                      Create Project
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading project portfolio...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Projects Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new project workspace to start planning sprints.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-6 group hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <div className={cn("h-1.5 -mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r", p.color)} />
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold truncate">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {p.description || "No project description provided."}
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-[11px] text-muted-foreground uppercase tracking-widest">AI Health</div>
                      <div className={cn("font-display text-2xl font-bold", p.ai_health >= 75 ? "text-healthy" : p.ai_health >= 55 ? "text-warning" : "text-critical")}>
                        {Math.round(p.ai_health)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Sprint Completion</span>
                      <span className="font-semibold">{Math.round(p.completion)}%</span>
                    </div>
                    <Progress value={p.completion} className="h-2" />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users2 className="h-4 w-4" /> {p.developer_count} developers
                    </div>
                    <div className="flex gap-1">
                      {user.role === "scrum" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openMembersDialog(p)}
                            title="Manage Developers"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(p)}
                            title="Edit Project"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(p.id)}
                            title="Delete Project"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-2 group-hover:border-primary group-hover:text-primary">
                    Open Project Workspace <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md glass-strong border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Theme Color</Label>
              <Select value={projColor} onValueChange={setProjColor}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
              Save Project Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Team Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-md glass-strong border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Project Team Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedDevId} onValueChange={setSelectedDevId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select developer to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {developersList.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} ({d.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignMember} className="gradient-primary text-white">
                Assign
              </Button>
            </div>

            <div className="border-t border-border/60 pt-3">
              <Label className="text-sm font-semibold mb-2 block">Assigned Developers</Label>
              {selectedProj && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {developersList.filter(d => 
                    selectedProj?.developer_ids?.includes(d.id)
                  ).map(d => (
                    <div key={d.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                      <div>
                        <div className="text-sm font-semibold">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">{d.email}</div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveMember(d.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
