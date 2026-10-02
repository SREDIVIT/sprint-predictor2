import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ShieldCheck, Code2, ArrowRight, Zap, LineChart, Bot, UserPlus, LogIn, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · SprintSense AI" },
      { name: "description", content: "Sign in to SprintSense, the AI-powered sprint risk predictor for high-performing agile teams." },
      { property: "og:title", content: "Sign in · SprintSense AI" },
      { property: "og:description", content: "AI-powered sprint risk prediction for high-performing agile teams." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("scrum");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { access_token, user: authUser } = res.data;
      
      setAuth({
        id: authUser.id,
        role: authUser.role as Role,
        name: authUser.name,
        email: authUser.email,
        token: access_token,
        firstLogin: authUser.first_login,
      });

      toast.success(`Welcome back, ${authUser.name}!`);

      if (authUser.first_login) {
        navigate({ to: "/change-password" });
      } else {
        navigate({ to: authUser.role === "scrum" ? "/dashboard" : "/dev/dashboard" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error("Please enter name, email, and password.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/register-scrum-master", {
        name,
        email,
        password,
        role: "scrum"
      });

      toast.success("Registration successful! Logging you in...");
      // Auto login after registration
      const loginRes = await api.post("/api/auth/login", { email, password });
      const { access_token, user: authUser } = loginRes.data;

      setAuth({
        id: authUser.id,
        role: authUser.role as Role,
        name: authUser.name,
        email: authUser.email,
        token: access_token,
        firstLogin: authUser.first_login,
      });

      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", {
        email: forgotEmail,
        new_password: newPassword,
      });
      toast.success(res.data?.message || "Password reset successfully!");
      setEmail(forgotEmail);
      setPassword(newPassword);
      setForgotOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to reset password. Please verify your email.");
    } finally {
      setForgotLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: illustration */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-primary via-fuchsia-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-40" style={{
          background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.2), transparent 40%)"
        }} />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: `${20 + (i * 7) % 80}px`,
                height: `${20 + (i * 7) % 80}px`,
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${3 + (i % 4)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">SprintSense</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="font-display text-5xl font-bold leading-tight">
            Predict sprint risk<br/>before it happens.
          </h1>
          <p className="text-lg text-white/85 max-w-md">
            An AI copilot for scrum masters. Continuously analyzes every story update to surface risk, recommend action, and protect your sprint.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Bot, k: "AI", v: "Continuous" },
              { icon: LineChart, k: "94%", v: "Forecast accuracy" },
              { icon: Zap, k: "12x", v: "Faster triage" },
            ].map(({ icon: I, k, v }) => (
              <div key={k} className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4">
                <I className="h-5 w-5 mb-2" />
                <div className="font-display text-2xl font-bold">{k}</div>
                <div className="text-xs text-white/75">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/70">Trusted by agile teams shipping to production every day.</div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">SprintSense</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create SM Workspace"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to your workspace to continue." : "Register as a Scrum Master to build your team."}
            </p>
          </div>

          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1.5 rounded-xl border">
            <button
              onClick={() => { setMode("login"); setRole("scrum"); }}
              className={cn("py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all", mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setRole("scrum"); }}
              className={cn("py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all", mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <UserPlus className="h-3.5 w-3.5" /> Register SM
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Show role toggles only in login mode */}
            {mode === "login" && (
              <div className="grid grid-cols-2 gap-3">
                <RoleCard active={role === "scrum"} onClick={() => setRole("scrum")} icon={ShieldCheck} title="Scrum Master" subtitle="Full workspace" />
                <RoleCard active={role === "developer"} onClick={() => setRole("developer")} icon={Code2} title="Developer" subtitle="My stories" />
              </div>
            )}

            <div className="space-y-4">
              {mode === "register" && (
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Riley Park" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
                </div>
              )}
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotOpen(true);
                      }}
                      className="text-xs text-primary hover:underline font-medium focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-white h-11 text-sm font-semibold shadow-lg glow">
              {loading ? "Processing..." : (mode === "login" ? `Continue as ${role === "scrum" ? "Scrum Master" : "Developer"}` : "Create Scrum Master Account")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {mode === "login" && (
            <p className="text-xs text-center text-muted-foreground">
              Tip: Seed user logins are `riley@sprintsense.ai` or `ava@sprintsense.ai` (Password: `Password123`)
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <KeyRound className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold">Reset Your Password</DialogTitle>
            </div>
            <DialogDescription>
              Enter your registered account email and set a new password to access your workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
            <div>
              <Label htmlFor="forgot-email">Account Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="new-pw">New Password</Label>
              <Input
                id="new-pw"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input
                id="confirm-pw"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                disabled={forgotLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={forgotLoading}
                className="gradient-primary text-white"
              >
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleCard({ active, onClick, icon: Icon, title, subtitle }: { active: boolean; onClick: () => void; icon: any; title: string; subtitle: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border p-4 transition-all w-full",
        active ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/50 hover:bg-accent/40",
      )}
    >
      <div className={cn("grid h-9 w-9 place-items-center rounded-lg mb-2", active ? "gradient-primary text-white" : "bg-muted text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}

