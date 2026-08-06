import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { HealthBadge } from "@/components/health-badge";
import { useAuth } from "@/lib/auth";
import {
  Calendar, Target, Sparkles, ShieldCheck, AlertTriangle, ShieldAlert,
  TrendingUp, Play, Users, MessageSquare, Clock, Plus, ClipboardList, Trash2, Bot
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sprint")({
  head: () => ({
    meta: [
      { title: "Sprint Board · SprintSense AI" },
      { name: "description", content: "Track active sprints and manage tasks on the interactive Kanban board." },
    ],
  }),
  component: SprintPage,
});

const KANBAN_STATUSES = ["Backlog", "To Do", "In Progress", "Testing", "Review", "Done"] as const;
type KanbanStatus = typeof KANBAN_STATUSES[number];

function SprintPage() {
  const user = useAuth();
  
  // Selected project & sprint context
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  
  // Kanban board tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Predict Risk output state
  const [riskData, setRiskData] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  
  // Modals & Forms
  const [sprintOpen, setSprintOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Sprint form
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintCapacity, setSprintCapacity] = useState("50");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  
  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDevId, setTaskDevId] = useState("");
  const [taskPoints, setTaskPoints] = useState("3");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  
  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const loadData = async () => {
    try {
      const projRes = await api.get("/api/projects");
      setProjects(projRes.data);
      
      const devRes = await api.get("/api/developers");
      setDevelopers(devRes.data.filter((d: any) => !d.is_disabled));
      
      if (projRes.data.length > 0) {
        // Default to first project if not selected
        const defaultProjId = selectedProjectId || projRes.data[0].id.toString();
        setSelectedProjectId(defaultProjId);
        await loadSprintAndTasks(defaultProjId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const loadSprintAndTasks = async (projId: string) => {
    try {
      const sprintRes = await api.get("/api/sprints", { params: { project_id: projId } });
      const active = sprintRes.data.find((s: any) => s.is_active);
      setActiveSprint(active || null);
      setRiskData(null); // Clear previous risk predictions
      
      if (active) {
        const taskRes = await api.get("/api/tasks", { params: { sprint_id: active.id } });
        setTasks(taskRes.data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
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
    loadSprintAndTasks(val);
  };

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  // Create sprint handler
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName || !sprintStart || !sprintEnd) {
      toast.error("Please fill in sprint name and dates.");
      return;
    }
    try {
      const res = await api.post("/api/sprints", {
        name: sprintName,
        goal: sprintGoal,
        capacity: parseInt(sprintCapacity),
        start_date: sprintStart,
        end_date: sprintEnd,
        project_id: parseInt(selectedProjectId)
      });
      // Activate sprint automatically
      await api.put(`/api/sprints/${res.data.id}`, { is_active: true });
      toast.success("Sprint planned and activated!");
      setSprintOpen(false);
      
      // Reset form
      setSprintName("");
      setSprintGoal("");
      setSprintCapacity("50");
      setSprintStart("");
      setSprintEnd("");
      
      setLoading(true);
      loadSprintAndTasks(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create sprint.");
    }
  };

  // Create task handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) {
      toast.error("Task title is required.");
      return;
    }
    try {
      await api.post("/api/tasks", {
        title: taskTitle,
        description: taskDesc,
        assigned_developer_id: taskDevId ? parseInt(taskDevId) : null,
        story_points: parseInt(taskPoints),
        priority: taskPriority,
        due_date: taskDueDate || null,
        status: "Backlog",
        project_id: parseInt(selectedProjectId),
        sprint_id: activeSprint.id
      });
      toast.success("Task added to Kanban Board.");
      setTaskOpen(false);
      
      // Reset form
      setTaskTitle("");
      setTaskDesc("");
      setTaskDevId("");
      setTaskPoints("3");
      setTaskPriority("Medium");
      setTaskDueDate("");
      
      loadSprintAndTasks(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add task.");
    }
  };

  // Trigger Sprint Risk Prediction
  const handlePredictRisk = async () => {
    if (!activeSprint) return;
    setPredicting(true);
    try {
      const res = await api.post(`/api/sprints/${activeSprint.id}/predict-risk`);
      setRiskData(res.data);
      // Reload sprint success probability
      const sprintRes = await api.get("/api/sprints", { params: { project_id: selectedProjectId } });
      const active = sprintRes.data.find((s: any) => s.is_active);
      setActiveSprint(active);
      toast.success("AI Sprint Risk analysis completed.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Risk forecasting failed.");
    } finally {
      setPredicting(false);
    }
  };

  // Kanban HTML5 drag & drop triggers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: KanbanStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    
    const taskId = parseInt(taskIdStr);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (task.status === status) return;

    // Enforce role check: Only assigned developer can change task status.
    if (user.role === "developer" && task.assigned_developer_id !== user.id) {
      toast.error("Access Denied: Only the developer assigned to this task can move it.");
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    
    try {
      await api.put(`/api/tasks/${taskId}`, { status });
      toast.success(`Task status updated to ${status}`);
    } catch (err: any) {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
      toast.error(err.response?.data?.detail || "Failed to update task position.");
    }
  };

  // Click on task details
  const handleOpenTask = async (task: any) => {
    setSelectedTask(task);
    setDetailOpen(true);
    // Load comments
    try {
      const res = await api.get(`/api/tasks/${task.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      const res = await api.post(`/api/tasks/${selectedTask.id}/comments`, {
        comment: newComment
      });
      setComments(prev => [...prev, res.data]);
      setNewComment("");
      toast.success("Comment posted.");
    } catch (err: any) {
      toast.error("Failed to add comment.");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      toast.success("Task deleted.");
      setDetailOpen(false);
      loadSprintAndTasks(selectedProjectId);
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  // Summarize stats for active sprint
  const totalStories = tasks.length;
  const doneStories = tasks.filter(t => t.status === "Done").length;
  const blockedStories = tasks.filter(t => t.status === "To Do" && t.priority === "Critical").length; // Simulated blocker ratio
  const progressPercent = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Workspace Board
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Active Sprint</h1>
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
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading sprint information...</div>
          </div>
        ) : !activeSprint ? (
          <div className="flex flex-col h-72 items-center justify-center glass rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
            <ClipboardList className="h-12 w-12 text-muted-foreground" />
            <h2 className="font-display text-2xl font-bold">No Active Sprint</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              There is currently no active sprint planned for this project workspace. Sprints organize story points and trigger the ML predictor.
            </p>
            {user.role === "scrum" && (
              <Dialog open={sprintOpen} onOpenChange={setSprintOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-white shadow-lg glow">
                    <Play className="h-4 w-4 mr-1.5" /> Plan & Start Sprint
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md glass-strong border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold">Sprint Planning</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSprint} className="space-y-4">
                    <div>
                      <Label htmlFor="sprint-name">Sprint Name</Label>
                      <Input
                        id="sprint-name"
                        placeholder="e.g. Sprint 25 — Atlas checkout"
                        value={sprintName}
                        onChange={(e) => setSprintName(e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sprint-goal">Sprint Goal</Label>
                      <Textarea
                        id="sprint-goal"
                        placeholder="Commitment and deliverable goals..."
                        value={sprintGoal}
                        onChange={(e) => setSprintGoal(e.target.value)}
                        className="mt-1.5"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <Label htmlFor="capacity">Capacity (Pts)</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={sprintCapacity}
                          onChange={(e) => setSprintCapacity(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label htmlFor="start">Start Date</Label>
                        <Input
                          id="start"
                          type="date"
                          value={sprintStart}
                          onChange={(e) => setSprintStart(e.target.value)}
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <Label htmlFor="end">End Date</Label>
                        <Input
                          id="end"
                          type="date"
                          value={sprintEnd}
                          onChange={(e) => setSprintEnd(e.target.value)}
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                      Start Active Sprint
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Sprint Overview Dashboard */}
            <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "var(--gradient-mesh)" }} />
              <div className="relative">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Sprint Details
                    </div>
                    <h2 className="font-display text-3xl font-bold">{activeSprint.name}</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl flex items-start gap-2">
                      <Target className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{activeSprint.goal || "No sprint goal defined."}</span>
                    </p>
                  </div>
                  
                  {/* Predict Risk CTA */}
                  <div className="text-right">
                    <Button
                      onClick={handlePredictRisk}
                      disabled={predicting}
                      className="gradient-primary text-white shadow-lg glow"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" /> {predicting ? "Analyzing Risk..." : "Forecast Sprint Risk"}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoTile icon={Calendar} label="Timeline" value={`${activeSprint.start_date} → ${activeSprint.end_date}`} />
                  <InfoTile icon={TrendingUp} label="Elapsed" value={`${activeSprint.days_elapsed} / ${activeSprint.days_total} Days`} />
                  <InfoTile icon={Target} label="Completed Stories" value={`${doneStories} / ${totalStories} Done`} />
                  <InfoTile icon={Sparkles} label="Success Probability" value={`${activeSprint.success_probability}%`} highlight />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Sprint Progress</span>
                    <span className="font-semibold">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
              </div>
            </div>

            {/* Risk Predictions Cards */}
            {riskData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in slide-in-from-top-4 duration-300">
                <div className="glass p-6 rounded-2xl md:col-span-1 flex flex-col justify-center text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">AI Risk Category</div>
                  <div className={cn(
                    "font-display text-4xl font-bold py-2",
                    riskData.risk_category === "High" ? "text-critical" : (riskData.risk_category === "Medium" ? "text-warning" : "text-healthy")
                  )}>
                    {riskData.risk_category} Risk
                  </div>
                  <div className="text-3xl font-display font-semibold text-gradient">{riskData.risk_percent}% Score</div>
                  <div className="text-xs text-muted-foreground">Confidence: {riskData.confidence_score}%</div>
                </div>
                
                <div className="glass p-6 rounded-2xl md:col-span-2 space-y-4">
                  <div>
                    <h4 className="font-display text-base font-bold text-primary flex items-center gap-1.5"><Bot className="h-4 w-4" /> AI Explanation</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{riskData.explanation}</p>
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-primary flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Recommendations</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 mt-1">
                      {riskData.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs for Overview vs Kanban */}
            <Tabs defaultValue="kanban" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-muted/40 border">
                  <TabsTrigger value="kanban" className="text-xs font-semibold">Kanban Board</TabsTrigger>
                  <TabsTrigger value="backlog" className="text-xs font-semibold">Sprint Backlog Snapshot</TabsTrigger>
                </TabsList>
                
                <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-primary text-white font-semibold">
                      <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md glass-strong border-border">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl font-bold">Add Task to Sprint</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                        <Label htmlFor="task-title">Task Title</Label>
                        <Input
                          id="task-title"
                          placeholder="e.g. Write E2E checkout tests"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-desc">Description</Label>
                        <Textarea
                          id="task-desc"
                          placeholder="Details, requirements, and comments..."
                          value={taskDesc}
                          onChange={(e) => setTaskDesc(e.target.value)}
                          className="mt-1.5"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Assign Developer</Label>
                          <Select value={taskDevId} onValueChange={setTaskDevId}>
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
                          <Label htmlFor="points">Story Points</Label>
                          <Input
                            id="points"
                            type="number"
                            value={taskPoints}
                            onChange={(e) => setTaskPoints(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select value={taskPriority} onValueChange={setTaskPriority}>
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
                          <Label htmlFor="due">Due Date</Label>
                          <Input
                            id="due"
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                        Add Task
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Kanban Drag & Drop View */}
              <TabsContent value="kanban" className="m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
                  {KANBAN_STATUSES.map((status) => {
                    const statusTasks = tasks.filter(t => t.status === status);
                    return (
                      <div
                        key={status}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                        className="rounded-2xl bg-muted/20 border border-border/50 p-4 min-w-[200px] flex flex-col space-y-3 min-h-[450px]"
                      >
                        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
                          <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">{status}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{statusTasks.length}</span>
                        </div>
                        
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
                          {statusTasks.map((t) => {
                            const dev = developers.find(d => d.id === t.assigned_developer_id);
                            return (
                              <div
                                key={t.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                onClick={() => handleOpenTask(t)}
                                className="glass p-4 rounded-xl border border-border/40 space-y-3 cursor-grab hover:border-primary/50 transition-all hover:shadow-md"
                              >
                                <div className="text-sm font-semibold leading-tight line-clamp-2">{t.title}</div>
                                
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full font-bold",
                                    t.priority === "Critical" ? "bg-critical/10 text-critical" :
                                    (t.priority === "High" ? "bg-warning/10 text-warning" : "bg-info/10 text-info")
                                  )}>
                                    {t.priority}
                                  </span>
                                  <span className="font-semibold text-muted-foreground">{t.story_points} Pts</span>
                                </div>
                                
                                <div className="flex items-center justify-between border-t border-border/20 pt-2 text-[10px] text-muted-foreground">
                                  <span className="truncate max-w-[100px]">
                                    {dev ? dev.name : "Unassigned"}
                                  </span>
                                  {t.due_date && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {t.due_date.slice(5)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Sprint Backlog Snapshot Table */}
              <TabsContent value="backlog" className="m-0 focus-visible:outline-none">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold mb-4">Sprint Backlog Snapshot</h3>
                  <div className="space-y-3">
                    {tasks.map((t) => {
                      const dev = developers.find(d => d.id === t.assigned_developer_id);
                      return (
                        <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/40 transition-colors border border-border/20 cursor-pointer" onClick={() => handleOpenTask(t)}>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            t.priority === "Critical" ? "bg-critical" : (t.priority === "High" ? "bg-warning" : "bg-info")
                          )} />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{t.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.status} · {t.story_points} pts · Assigned: {dev ? dev.name : "Unassigned"}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border">
                            {t.priority}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Task Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedTask && (
          <DialogContent className="max-w-lg glass-strong border-border">
            <DialogHeader className="flex flex-row justify-between items-start gap-4">
              <div>
                <DialogTitle className="font-display text-2xl font-bold">{selectedTask.title}</DialogTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Status: <span className="font-semibold text-foreground">{selectedTask.status}</span> · Points: <span className="font-semibold text-foreground">{selectedTask.story_points}</span>
                </div>
              </div>
              {user.role === "scrum" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              )}
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="bg-muted/30 p-4 rounded-2xl border text-sm leading-relaxed text-muted-foreground">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-1">Description</Label>
                {selectedTask.description || "No description provided."}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-b border-border/40 pb-4">
                <div>
                  <span className="text-muted-foreground block uppercase font-semibold">Assignee</span>
                  <span className="font-semibold text-sm mt-0.5 block">
                    {developers.find(d => d.id === selectedTask.assigned_developer_id)?.name || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase font-semibold">Due Date</span>
                  <span className="font-semibold text-sm mt-0.5 block">
                    {selectedTask.due_date || "No deadline"}
                  </span>
                </div>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-primary" /> Comments ({comments.length})</Label>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-muted/40 border border-border/20">
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">{c.user_name}</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{c.comment}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-background/50 h-10 text-xs"
                  />
                  <Button type="submit" size="sm" className="gradient-primary text-white h-10">Post</Button>
                </form>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}

function InfoTile({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`font-display text-xl font-bold mt-1.5 truncate ${highlight ? "text-gradient" : ""}`}>{value}</div>
    </div>
  );
}
