import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { HealthBadge } from "@/components/health-badge";
import { useAuth } from "@/lib/auth";
import {
  FolderKanban, Rocket, Users, ListChecks, CheckCircle2, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar,
} from "recharts";
import { projects, developers, sprint, stats, weeklyProgress, workloadData, stories } from "@/lib/mock-data";

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
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role === "developer") return <Navigate to="/dev/dashboard" />;

  const s = stats();
  const riskDist = [
    { name: "Healthy", value: s.healthy, color: "var(--healthy)" },
    { name: "Warning", value: s.warning, color: "var(--warning)" },
    { name: "Critical", value: s.critical, color: "var(--critical)" },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Overview
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Good afternoon, {user.name.split(" ")[0]}.</h1>
            <p className="text-muted-foreground mt-1">Here's what your AI copilot noticed across your sprint today.</p>
          </div>
          <div className="glass rounded-2xl px-5 py-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Sprint success probability</div>
            <div className="font-display text-3xl font-bold text-gradient">{sprint.successProbability}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard label="Projects" value={projects.length} icon={FolderKanban} accent="primary" trend="4 active" />
          <StatCard label="Active Sprint" value="24" icon={Rocket} accent="info" trend="10 of 14 days" />
          <StatCard label="Developers" value={developers.length} icon={Users} accent="primary" trend="6 online" />
          <StatCard label="Total Stories" value={s.total} icon={ListChecks} accent="info" />
          <StatCard label="Completed" value={s.done} icon={CheckCircle2} accent="healthy" trend={`${Math.round(s.done / s.total * 100)}% of sprint`} />
          <StatCard label="Healthy" value={s.healthy} icon={ShieldCheck} accent="healthy" />
          <StatCard label="Warning" value={s.warning} icon={AlertTriangle} accent="warning" />
          <StatCard label="Critical" value={s.critical} icon={ShieldAlert} accent="critical" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Sprint progress</h3>
                <p className="text-xs text-muted-foreground">Planned vs actual burn-up</p>
              </div>
              <div className="text-xs px-2.5 py-1 rounded-full bg-healthy/10 text-healthy font-semibold">On track</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyProgress}>
                <defs>
                  <linearGradient id="p1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="p2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--healthy)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--healthy)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="planned" stroke="var(--primary)" strokeWidth={2} fill="url(#p1)" />
                <Area type="monotone" dataKey="actual" stroke="var(--healthy)" strokeWidth={2} fill="url(#p2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-1">AI risk distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">Live classification of {s.total} stories</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskDist} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {riskDist.map((r) => <Cell key={r.name} fill={r.color} />)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <h3 className="font-display text-lg font-bold mb-4">Developer workload</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="assigned" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completed" fill="var(--healthy)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-1">Sprint success</h3>
            <p className="text-xs text-muted-foreground mb-2">AI forecast probability</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: "success", value: sprint.successProbability, fill: "var(--primary)" }]} startAngle={220} endAngle={-40}>
                <RadialBar background dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-32 mb-14">
              <div className="font-display text-4xl font-bold text-gradient">{sprint.successProbability}%</div>
              <div className="text-xs text-muted-foreground mt-1">Likely to hit sprint goal</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Story completion trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--primary)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
