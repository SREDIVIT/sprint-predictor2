import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/lib/auth";
import { ListChecks, CheckCircle2, Clock3, Rocket, Sparkles, TrendingUp, Send, Bot, MessageSquare, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dev/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard · SprintSense AI" },
      { name: "description", content: "Your assigned stories, today's progress, and current sprint at a glance." },
      { property: "og:title", content: "My Dashboard · SprintSense AI" },
      { property: "og:description", content: "Your assigned stories and current sprint at a glance." },
    ],
  }),
  component: DevDashboard,
});

function DevDashboard() {
  const user = useAuth();
  
  // Dashboard states
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Standup form states
  const [yesterdayWork, setYesterdayWork] = useState("");
  const [todayPlan, setTodayPlan] = useState("");
  const [blockers, setBlockers] = useState("");
  const [standupLoading, setStandupLoading] = useState(false);

  // AI Copilot Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: "assistant", text: "Hello! I am your SprintSense Copilot. Ask me questions about task prioritization, Scrum concepts, or how to mitigate sprint risks." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects to find active sprint
      const projRes = await api.get("/api/projects");
      if (projRes.data.length > 0) {
        const p1 = projRes.data[0];
        
        // Load active sprint
        const sprintRes = await api.get("/api/sprints", { params: { project_id: p1.id } });
        const active = sprintRes.data.find((s: any) => s.is_active);
        setActiveSprint(active || null);

        if (active) {
          // Load all tasks in this sprint assigned to user
          const taskRes = await api.get("/api/tasks", { params: { sprint_id: active.id } });
          const myTasks = taskRes.data.filter((t: any) => t.assigned_developer_id === user?.id);
          setTasks(myTasks);
        }
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
      fetchDashboardData();
    }
  }, [user]);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  // Submit Standup
  const submitStandup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterdayWork || !todayPlan) {
      toast.error("Please fill in yesterday's accomplishments and today's plan.");
      return;
    }
    setStandupLoading(true);
    try {
      await api.post("/api/developers/standup", {
        yesterday_work: yesterdayWork,
        today_plan: todayPlan,
        blockers: blockers || null
      });
      toast.success("Daily Standup submitted successfully!");
      setYesterdayWork("");
      setTodayPlan("");
      setBlockers("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to submit standup.");
    } finally {
      setStandupLoading(false);
    }
  };

  // Submit Chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const contextData = activeSprint ? {
        sprint_name: activeSprint.name,
        sprint_goal: activeSprint.goal,
        tasks_count: tasks.length,
        done_count: tasks.filter(t => t.status === "Done").length,
        risk_percent: 100 - activeSprint.success_probability
      } : {};

      const res = await api.post("/api/ai/chat", {
        message: userMsg,
        context: contextData
      });
      
      setChatHistory(prev => [...prev, { role: "assistant", text: res.data.response }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: "assistant", text: "Sorry, I am having trouble connecting to the AI brain right now." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const assigned = tasks.length;
  const completed = tasks.filter(t => t.status === "Done").length;
  const pending = assigned - completed;
  const progressPercent = activeSprint ? Math.round(activeSprint.days_elapsed / activeSprint.days_total * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Developer Workspace
          </div>
          <h1 className="font-display text-4xl font-bold mt-1">Welcome back, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's your sprint summary and tasks list.</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading workspace board...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
              <StatCard label="Assigned Tasks" value={assigned} icon={ListChecks} accent="primary" />
              <StatCard label="Completed Tasks" value={completed} icon={CheckCircle2} accent="healthy" />
              <StatCard label="Pending Tasks" value={pending} icon={Clock3} accent="warning" />
              <StatCard label="Sprint Days elapsed" value={activeSprint ? `${activeSprint.days_elapsed}d / ${activeSprint.days_total}d` : "0 / 0"} icon={TrendingUp} accent="info" />
            </div>

            {/* Active Sprint Overview */}
            {activeSprint && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> {activeSprint.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{activeSprint.goal}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Sprint Success Probability</div>
                    <div className="font-display text-2xl font-bold text-gradient">{Math.round(activeSprint.success_probability)}%</div>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
                <div className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wide font-bold">{activeSprint.days_elapsed} of {activeSprint.days_total} days completed</div>
              </div>
            )}

            {/* Main Section split: Standup Form & Copilot Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Standup Form */}
              <div className="glass rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-lg font-bold">Daily Standup</h3>
                  </div>
                  
                  <form onSubmit={submitStandup} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <Label htmlFor="yesterday">What did you accomplish yesterday?</Label>
                      <Textarea
                        id="yesterday"
                        placeholder="e.g. Refactored checkout OAuth flows and merged PR..."
                        value={yesterdayWork}
                        onChange={(e) => setYesterdayWork(e.target.value)}
                        rows={2}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="today">What are you working on today?</Label>
                      <Textarea
                        id="today"
                        placeholder="e.g. Setting up APNs retry queues and tuning Docker compose..."
                        value={todayPlan}
                        onChange={(e) => setTodayPlan(e.target.value)}
                        rows={2}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="blockers" className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-warning" /> Do you have any blockers?</Label>
                      <Input
                        id="blockers"
                        placeholder="e.g. Blocked on merchant cert approvals from Apple (leave empty if none)..."
                        value={blockers}
                        onChange={(e) => setBlockers(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={standupLoading} className="w-full gradient-primary text-white h-10 font-semibold shadow-md">
                      {standupLoading ? "Submitting..." : "Submit Daily Standup"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Embedded AI Assistant */}
              <div className="glass rounded-2xl p-6 flex flex-col h-[380px] justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-lg font-bold">AI Assistant</h3>
                  </div>
                  
                  {/* Chat feed */}
                  <div className="space-y-3 overflow-y-auto h-[230px] pr-1 scrollbar-thin">
                    {chatHistory.map((chat, idx) => (
                      <div key={idx} className={cn(
                        "p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed",
                        chat.role === "user"
                          ? "bg-primary/10 border border-primary/20 text-foreground ml-auto"
                          : "bg-muted/40 border border-border/20 text-muted-foreground mr-auto"
                      )}>
                        {chat.text}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="p-2.5 rounded-xl text-xs bg-muted/40 border border-border/20 text-muted-foreground mr-auto animate-pulse">
                        Thinking...
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 border-t border-border/40 pt-3 mt-2">
                  <Input
                    placeholder="Ask about priorities, Agile tips, blockers..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-background/50 text-xs h-10"
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="icon" className="gradient-primary text-white h-10 w-10 shrink-0" disabled={chatLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
