import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useDemoStore } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks — DeadlineOS" }] }),
});

type Tab = "today" | "week" | "later" | "done";

function TasksPage() {
  const tasks = useDemoStore((s) => s.tasks);
  const deadlines = useDemoStore((s) => s.deadlines);
  const updateTask = useDemoStore((s) => s.updateTask);
  const [tab, setTab] = useState<Tab>("today");

  const now = new Date();
  const inWeek = new Date(now.getTime() + 7 * 86400000);

  const buckets = useMemo(() => {
    const today = tasks.filter((t) => {
      const d = new Date(t.scheduledAt);
      return t.status !== "done" && d.toDateString() === now.toDateString();
    });
    const week = tasks.filter((t) => {
      const d = new Date(t.scheduledAt);
      return t.status !== "done" && d > now && d <= inWeek && d.toDateString() !== now.toDateString();
    });
    const later = tasks.filter((t) => {
      const d = new Date(t.scheduledAt);
      return t.status !== "done" && d > inWeek;
    });
    const done = tasks.filter((t) => t.status === "done");
    return { today, week, later, done };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const list = buckets[tab];

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Tasks</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything Dew has planned for you.</p>

      <div className="mt-6 flex gap-1 rounded-full border border-border bg-surface p-1 shadow-card">
        {(
          [
            { id: "today", label: `Today (${buckets.today.length})` },
            { id: "week", label: `This week (${buckets.week.length})` },
            { id: "later", label: `Later (${buckets.later.length})` },
            { id: "done", label: `Done (${buckets.done.length})` },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              tab === t.id ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {list.map((t) => {
          const dl = deadlines.find((d) => d.id === t.deadlineId);
          const overdue = new Date(t.scheduledAt) < now && t.status !== "done";
          return (
            <li key={t.id} className={cn("flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-card", overdue && "border-coral/40")}>
              <button
                onClick={() =>
                  t.status === "done"
                    ? updateTask(t.id, { status: "pending", completedAt: null })
                    : updateTask(t.id, { status: "done", completedAt: new Date().toISOString() })
                }
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border",
                  t.status === "done" ? "gradient-primary border-transparent text-primary-foreground" : "border-border hover:bg-accent",
                )}
                aria-label="Toggle done"
              >
                {t.status === "done" && <CheckCircle2 className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("font-semibold", t.status === "done" && "line-through opacity-60")}>{t.title}</div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(t.scheduledAt), "d MMM · h:mm a")}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {dl?.title} · <Clock className="inline h-3 w-3" /> {t.estimatedMinutes}m
                </div>
                {overdue && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-coral/15 px-2 py-0.5 text-xs text-[oklch(0.4_0.15_30)]">
                    <AlertTriangle className="h-3 w-3" /> Overdue
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing here.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
