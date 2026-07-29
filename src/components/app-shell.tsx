import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderKanban, Rocket, ListChecks, Users, Bell, FileBarChart, Settings, LogOut,
  Sparkles, Sun, Moon, Menu, X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { clearAuth, useAuth, useTheme } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const scrumNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/sprint", label: "Active Sprint", icon: Rocket },
  { to: "/stories", label: "Stories", icon: ListChecks },
  { to: "/developers", label: "Developers", icon: Users },
  { to: "/alerts", label: "AI Alerts", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const devNav = [
  { to: "/dev/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dev/stories", label: "My Stories", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const nav = user?.role === "developer" ? devNav : scrumNav;

  const doLogout = () => {
    clearAuth();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 transform transition-transform duration-300 glass-strong border-r",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-6 border-b border-border/60">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold leading-tight">SprintSense</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest">AI Risk Predictor</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "gradient-primary text-white shadow-md glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={doLogout}
            className="mt-4 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="gradient-primary text-white text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() ?? "SM"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user?.name ?? "Guest"}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{user?.role === "developer" ? "Developer" : "Scrum Master"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-border/60 glass-strong flex items-center gap-3 px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Workspace</div>
            <div className="font-semibold text-sm truncate">Atlas Payments · Production</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/alerts">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-critical animate-pulse" />
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 animate-in fade-in duration-300">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
