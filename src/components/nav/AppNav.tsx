import { Link, useLocation } from "@tanstack/react-router";
import { Home, Plus, ListChecks, CalendarDays, LineChart, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home; primary?: boolean };

const items: NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/add", label: "Add", icon: Plus, primary: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: LineChart },
];

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pt-2">
        {items.map((item) => {
          const active = pathname === item.to || (item.to !== "/home" && pathname.startsWith(item.to));
          const Icon = item.icon;
          if (item.primary) {
            return (
              <li key={item.to} className="-mt-6 flex justify-center">
                <Link
                  to={item.to as any}
                  className="grid h-14 w-14 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow ring-4 ring-background"
                  aria-label="Add notice"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.to}>
              <Link
                to={item.to as any}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const sideItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/add", label: "Add", icon: Plus },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function DesktopSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/60 lg:flex lg:flex-col">
      <div className="px-6 py-6">
        <Link to="/home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow font-display font-bold">
            D
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">DeadlineOS</span>
        </Link>
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {sideItems.map((item) => {
          const active = pathname === item.to || (item.to !== "/home" && pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to as any}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-accent-foreground shadow-card"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4 text-xs text-muted-foreground">
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="font-medium text-foreground">Demo mode</p>
          <p className="mt-1 leading-snug">All data lives in your browser. Real backend can be enabled from Settings.</p>
        </div>
      </div>
    </aside>
  );
}
