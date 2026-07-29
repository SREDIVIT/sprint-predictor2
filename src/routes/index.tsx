import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const user = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "developer" ? "/dev/dashboard" : "/dashboard"} />;
}
