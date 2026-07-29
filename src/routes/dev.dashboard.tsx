import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/lib/auth";
import { stories, sprint } from "@/lib/mock-data";
import { ListChecks, CheckCircle2, Clock3, Rocket, Sparkles, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { weeklyProgress } from "@/lib/mock-data";

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
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  // treat logged-in dev as d1 (Ava Chen) for demo
  const mine = stories.filter((s) => s.developerId === "d1");
  const assigned = mine.length;
  const completed = mine.filter((s) => s.status === "Done").length;
  const pending = assigned - completed;

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Developer Workspace
          </div>
          <h1 className="font-display text-4xl font-bold mt-1">Welcome back, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's on your plate this sprint.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Assigned" value={assigned} icon={ListChecks} accent="primary" />
          <StatCard label="Completed" value={completed} icon={CheckCircle2} accent="healthy" />
          <StatCard label="Pending" value={pending} icon={Clock3} accent="warning" />
          <StatCard label="Today's Progress" value="+18%" icon={TrendingUp} accent="info" />
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> {sprint.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{sprint.goal}</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Success prob.</div>
              <div className="font-display text-2xl font-bold text-gradient">{sprint.successProbability}%</div>
            </div>
          </div>
          <Progress value={sprint.progress} className="h-2.5" />
          <div className="text-xs text-muted-foreground mt-2">{sprint.daysElapsed} / {sprint.daysTotal} days elapsed</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Your weekly progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
