import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HealthBadge } from "@/components/health-badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { Sparkles, Trophy, ListChecks, CheckCircle2, Plus, Edit2, ShieldAlert, Key, Ban, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Developers · SprintSense AI" },
      { name: "description", content: "Team roster with AI-scored performance, workload, and current story health." },
      { property: "og:title", content: "Developers · SprintSense AI" },
      { property: "og:description", content: "Team roster with AI-scored performance and workload." },
    ],
  }),
  component: DevelopersPage,
});

function DevelopersPage() {
  const user = useAuth();
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog open states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  // Form states
  const [selectedDev, setSelectedDev] = useState<any>(null);
  const [devName, setDevName] = useState("");
  const [devEmail, setDevEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const fetchDevelopers = async () => {
    try {
      const res = await api.get("/api/developers");
      // For developer metrics, since SQLite model might not hold temporary runtime performance, 
      // we merge with default metric placeholders if empty, but we fetch the real list
      setDevelopers(res.data);
    } catch (err) {
      console.error("Error loading developers", err);
      toast.error("Failed to load developers roster.");
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchDevelopers().finally(() => setLoading(false));
    }
  }, [user]);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName || !devEmail || !tempPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await api.post("/api/developers", {
        name: devName,
        email: devEmail,
        temporary_password: tempPassword,
      });
      toast.success("Developer account created successfully!");
      setCreateOpen(false);
      setDevName("");
      setDevEmail("");
      setTempPassword("");
      fetchDevelopers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create developer.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName || !devEmail) {
      toast.error("Name and email are required.");
      return;
    }
    try {
      await api.put(`/api/developers/${selectedDev.id}`, {
        name: devName,
        email: devEmail,
      });
      toast.success("Developer details updated!");
      setEditOpen(false);
      fetchDevelopers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to edit developer.");
    }
  };

  const handleToggleDisabled = async (dev: any) => {
    try {
      await api.put(`/api/developers/${dev.id}`, {
        is_disabled: !dev.is_disabled,
      });
      toast.success(dev.is_disabled ? "Developer account enabled!" : "Developer account disabled.");
      fetchDevelopers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Operation failed.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPassword) {
      toast.error("Please enter a temporary password.");
      return;
    }
    try {
      await api.post("/api/developers/reset-password", {
        email: selectedDev.email,
        temporary_password: tempPassword,
      });
      toast.success("Password reset successfully! Developer forced to change on next login.");
      setPwOpen(false);
      setTempPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reset password.");
    }
  };

  const openEditDialog = (dev: any) => {
    setSelectedDev(dev);
    setDevName(dev.name);
    setDevEmail(dev.email);
    setEditOpen(true);
  };

  const openPwDialog = (dev: any) => {
    setSelectedDev(dev);
    setPwOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Team
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Developers</h1>
            <p className="text-muted-foreground mt-1">
              {developers.length} developers registered in your Agile workspace
            </p>
          </div>
          {user.role === "scrum" && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white shadow-lg glow">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Developer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md glass-strong border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-bold">Add Developer Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Developer Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Marcus Reed"
                      value={devName}
                      onChange={(e) => setDevName(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Developer Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="dev@company.com"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="temp-pw">Temporary Password</Label>
                    <Input
                      id="temp-pw"
                      type="password"
                      placeholder="Temporary password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                    Create Developer Account
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading developers roster...</div>
          </div>
        ) : developers.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Developers Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add developers to your workspace so they can take on stories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {developers.map((d) => {
              const assigned = d.assigned_count ?? 0;
              const completed = d.completed_count ?? 0;
              const currentStory = d.current_story ?? "No active story assigned";
              const performance = d.performance ?? 100;
              const health = d.health ?? "healthy";


              return (
                <div key={d.id} className={cn("glass rounded-2xl p-6 group hover:-translate-y-1 transition-all flex flex-col justify-between border", d.is_disabled ? "border-destructive/20 opacity-70" : "border-border/60")}>
                  <div>
                    <div className="flex items-start gap-4">
                      <div className={cn("h-14 w-14 shrink-0 rounded-2xl text-white grid place-items-center font-bold text-lg shadow-lg", d.is_disabled ? "bg-muted" : "gradient-primary")}>
                        {d.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-lg font-bold truncate flex items-center gap-1.5">
                          {d.name}
                          {d.is_disabled && <span className="text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-semibold">Disabled</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{d.email}</div>
                        <div className="mt-2"><HealthBadge status={d.is_disabled ? "warning" : health} /></div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MiniStat icon={ListChecks} label="Assigned" value={assigned} />
                      <MiniStat icon={CheckCircle2} label="Completed" value={completed} />
                    </div>

                    <div className="mt-4">
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Current story</div>
                      <div className="text-sm font-medium truncate">{currentStory}</div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-primary" /> Performance</span>
                        <span className="font-semibold">{performance}</span>
                      </div>
                      <Progress value={performance} className="h-2" />
                    </div>
                  </div>

                  {user.role === "scrum" && (
                    <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(d)}
                        className="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPwDialog(d)}
                        className="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Key className="h-3.5 w-3.5" /> Reset Pw
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleDisabled(d)}
                        className={cn("text-xs font-semibold gap-1", d.is_disabled ? "text-healthy hover:bg-healthy/5" : "text-destructive hover:bg-destructive/5")}
                      >
                        <Ban className="h-3.5 w-3.5" /> {d.is_disabled ? "Enable" : "Disable"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Developer Details Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md glass-strong border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Edit Developer Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Developer Name</Label>
              <Input
                id="edit-name"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Developer Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
              Save Developer Details
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Developer Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-md glass-strong border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 text-destructive text-xs leading-relaxed mb-1">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> Tapping reset password generates a new temporary credentials token. The developer will be forced to change this password on their next sign-in.
              </div>
            </div>
            <div>
              <Label htmlFor="reset-pw">Temporary Password</Label>
              <Input
                id="reset-pw"
                type="password"
                placeholder="Enter temporary password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-white h-11 font-semibold mt-2">
              Reset Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function MiniStat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider"><Icon className="h-3 w-3" /> {label}</div>
      <div className="font-display text-xl font-bold mt-0.5">{value}</div>
    </div>
  );
}
