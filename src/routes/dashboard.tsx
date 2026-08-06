import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/lib/auth";
import {
  FolderKanban, Rocket, Users, ListChecks, CheckCircle2, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, Folder
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · SprintSense AI" },
      { name: "description", content: "Real-time AI insight into sprint risk, story health, and developer workload." },
      { property: "og:title", content: "Dashboard · SprintSense AI" },
      { property: "og:description", content: "Real-time AI insight into sprint risk and story health." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const projRes = await api.get("/api/projects");
      setProjects(projRes.data);
      
      if (projRes.data.length > 0) {
        const defaultProjId = selectedProjectId || projRes.data[0].id.toString();
        setSelectedProjectId(defaultProjId);
        await fetchAnalytics(defaultProjId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchAnalytics = async (projId: string) => {
    try {
      const res = await api.get("/api/analytics", { params: { project_id: projId } });
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadDashboardData();
    }
  }, [user]);

  const handleProjectChange = (val: string) => {
    setSelectedProjectId(val);
    setLoading(true);
    fetchAnalytics(val);
  };

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role === "developer") return <Navigate to="/dev/dashboard" />;

  const s = analytics?.stats || { total: 0, done: 0, healthy: 0, warning: 0, critical: 0 };
  const successProbability = analytics?.success_probability ?? 100.0;

  const riskDist = [
    { name: "Healthy", value: s.healthy, color: "#10b981" },
    { name: "Warning", value: s.warning, color: "#f59e0b" },
    { name: "Critical", value: s.critical, color: "#ef4444" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Project Selector */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Workspace Overview
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Good afternoon, {user.name.split(" ")[0]}.</h1>
            <p className="text-muted-foreground mt-1">Here's what your AI copilot noticed across your workspace today.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Project Workspace:</Label>
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

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading workspace insights...</div>
          </div>
        ) : !analytics ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Projects Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a project under the Projects tab to view AI analytics.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
              <StatCard label="Total Projects" value={projects.length} icon={FolderKanban} accent="primary" />
              <StatCard label="Sprint Success Rate" value={`${analytics.success_rate}%`} icon={Rocket} accent="info" />
              <StatCard label="Team Strength" value={analytics.workload_data.length} icon={Users} accent="primary" />
              <StatCard label="Total Stories" value={s.total} icon={ListChecks} accent="info" />
              <StatCard label="Completed" value={s.done} icon={CheckCircle2} accent="healthy" trend={`${s.total > 0 ? Math.round(s.done / s.total * 100) : 0}% completion`} />
              <StatCard label="Healthy" value={s.healthy} icon={ShieldCheck} accent="healthy" />
              <StatCard label="Warning" value={s.warning} icon={AlertTriangle} accent="warning" />
              <StatCard label="Critical" value={s.critical} icon={ShieldAlert} accent="critical" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Burnup progress */}
              <div className="glass rounded-2xl p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold">Sprint progress</h3>
                    <p className="text-xs text-muted-foreground">Planned vs actual burn-up (Story Points)</p>
                  </div>
                  <div className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-semibold",
                    successProbability >= 70 ? "bg-healthy/10 text-healthy" : "bg-warning/10 text-warning"
                  )}>
                    {successProbability >= 70 ? "On Track" : "At Risk"}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={analytics.weekly_progress}>
                    <defs>
                      <linearGradient id="p1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="p2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid #cbd5e1", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="planned" stroke="#8b5cf6" strokeWidth={2} fill="url(#p1)" />
                    <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fill="url(#p2)" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* AI risk distribution */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold mb-1">AI Risk Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4 font-semibold">Live classification of {s.total} user stories</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={riskDist.filter(r => r.value > 0)} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {riskDist.filter(r => r.value > 0).map((r) => <Cell key={r.name} fill={r.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {riskDist.map((r) => (
                    <div key={r.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.name}</span>
                      <span className="font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Developer Workload */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="glass rounded-2xl p-6 lg:col-span-2">
                <h3 className="font-display text-lg font-bold mb-1">Developer workload</h3>
                <p className="text-xs text-muted-foreground mb-4">Assigned vs completed stories count</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.workload_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid #cbd5e1", borderRadius: 12 }} />
                    <Bar dataKey="assigned" name="Assigned" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Success Probability Gauge */}
              <div className="glass rounded-2xl p-6 flex flex-col justify-between items-center text-center">
                <div className="w-full text-left">
                  <h3 className="font-display text-lg font-bold mb-1">Sprint success</h3>
                  <p className="text-xs text-muted-foreground">AI forecast probability</p>
                </div>
                <div className="relative w-full flex items-center justify-center h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "success", value: successProbability, fill: "#8b5cf6" }]} startAngle={220} endAngle={-40}>
                      <RadialBar background dataKey="value" cornerRadius={20} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <div className="font-display text-4xl font-bold text-gradient">{Math.round(successProbability)}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Likely to ship</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground max-w-[200px] mt-2">
                  Prediction is based on current bug density, carry forward tasks, and blocker frequency.
                </p>
              </div>
            </div>

            {/* Risk Trend Chart */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold mb-1">AI Risk Score Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Historical risk percentage score across recent check cycles</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.risk_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="check" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid #cbd5e1", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="risk" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: "#8b5cf6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
