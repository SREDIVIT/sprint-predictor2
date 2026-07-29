import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { projects, developers } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Sparkles, Users2, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Portfolio
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Projects</h1>
            <p className="text-muted-foreground mt-1">{projects.length} active projects · updated live by the AI engine</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-9 w-56" />
            </div>
            <Button className="gradient-primary text-white shadow-lg">
              <Plus className="h-4 w-4 mr-1.5" /> New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p.id} className="glass rounded-2xl p-6 group hover:-translate-y-1 transition-all">
              <div className={cn("h-1.5 -mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r", p.color)} />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.currentSprint}</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-widest">AI Health</div>
                  <div className={cn("font-display text-2xl font-bold", p.aiHealth >= 75 ? "text-healthy" : p.aiHealth >= 55 ? "text-warning" : "text-critical")}>
                    {p.aiHealth}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold">{p.completion}%</span>
                </div>
                <Progress value={p.completion} className="h-2" />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users2 className="h-4 w-4" /> {p.developers} developers
                </div>
                <div className="flex -space-x-2">
                  {developers.slice(0, Math.min(p.developers, 4)).map((d) => (
                    <div key={d.id} className="h-7 w-7 rounded-full gradient-primary text-white text-[10px] font-bold grid place-items-center ring-2 ring-background">
                      {d.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full mt-5 group-hover:border-primary group-hover:text-primary">
                Open project <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
