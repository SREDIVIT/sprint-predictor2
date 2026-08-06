import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, setAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      toast.success("Password changed successfully!");
      
      // Update local storage auth user
      const updatedUser = { ...user, firstLogin: false };
      setAuth(updatedUser);

      // Redirect based on role
      navigate({ to: user.role === "scrum" ? "/dashboard" : "/dev/dashboard" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update password. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 glass-strong p-8 rounded-3xl border border-border shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Security Update</h2>
          <p className="text-sm text-muted-foreground">
            This is your first login. You must set a permanent password to secure your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="old-pw">Temporary Password</Label>
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
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input
              id="confirm-pw"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-white h-11 text-sm font-semibold shadow-lg glow mt-2"
          >
            {loading ? "Updating..." : "Update Password"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
