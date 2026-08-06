import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth, useTheme, setAuth } from "@/lib/auth";
import { Sparkles, Save, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import api from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · SprintSense AI" },
      { name: "description", content: "Manage your SprintSense workspace, AI sensitivity, and notification preferences." },
      { property: "og:title", content: "Settings · SprintSense AI" },
      { property: "og:description", content: "Manage AI sensitivity and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuth();
  const { theme, toggle } = useTheme();
  
  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword
      });
      
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update password. Verify old password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Preferences
          </div>
          <h1 className="font-display text-4xl font-bold mt-1">Settings</h1>
        </div>

        {/* Profile Card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={user.name} className="mt-1.5 bg-background/40" disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} className="mt-1.5 bg-background/40" disabled />
            </div>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Update Password
          </h3>
          
          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="old-pw">Current Password</Label>
                <Input
                  id="old-pw"
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="new-pw">New Password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="confirm-pw">Confirm Password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gradient-primary text-white font-semibold">
              Update Password
            </Button>
          </form>
        </div>

        {/* AI Engine Settings */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">AI Engine</h3>
          <Row label="Auto-analyze after each update" desc="Trigger AI risk classification on story updates." defaultChecked />
          <Row label="Notify Scrum Master on critical" desc="Push critical alerts immediately." defaultChecked />
          <Row label="Weekly forecast digest" desc="Email a sprint success forecast every Monday." />
        </div>

        {/* Appearance Settings */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark Mode</div>
              <div className="text-xs text-muted-foreground">Currently using {theme} theme.</div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
        </div>

        <Button className="gradient-primary text-white" onClick={() => toast.success("Settings saved")}>
          <Save className="h-4 w-4 mr-1.5" /> Save preferences
        </Button>
      </div>
    </AppShell>
  );
}

function Row({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
