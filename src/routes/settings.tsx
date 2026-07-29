import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth, useTheme } from "@/lib/auth";
import { Sparkles, Save } from "lucide-react";
import { toast } from "sonner";

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
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Preferences
          </div>
          <h1 className="font-display text-4xl font-bold mt-1">Settings</h1>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Name</Label><Input defaultValue={user.name} className="mt-1.5" /></div>
            <div><Label>Email</Label><Input defaultValue={user.email} className="mt-1.5" /></div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">AI engine</h3>
          <Row label="Auto-analyze after each update" desc="Trigger AI risk classification on story updates." defaultChecked />
          <Row label="Notify Scrum Master on critical" desc="Push critical alerts immediately." defaultChecked />
          <Row label="Weekly forecast digest" desc="Email a sprint success forecast every Monday." />
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">Currently {theme}.</div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
        </div>

        <Button className="gradient-primary text-white" onClick={() => toast.success("Settings saved")}>
          <Save className="h-4 w-4 mr-1.5" /> Save changes
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
