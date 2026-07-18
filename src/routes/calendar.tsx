import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, subMonths, startOfWeek, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useDemoStore } from "@/lib/demo-store";
import { computeDeadlineRisk } from "@/lib/risk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Calendar — DeadlineOS" }] }),
});

function CalendarPage() {
  const deadlines = useDemoStore((s) => s.deadlines);
  const tasks = useDemoStore((s) => s.tasks);
  const reminders = useDemoStore((s) => s.reminders);
  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const arr: Date[] = [];
    let d = gridStart;
    while (d <= monthEnd || arr.length % 7 !== 0) {
      arr.push(d);
      d = addDays(d, 1);
      if (arr.length > 42) break;
    }
    return arr;
  }, [cursor]);

  const dayInfo = useMemo(() => {
    const map = new Map<string, { deadlines: typeof deadlines; level: "low" | "medium" | "high" | null }>();
    for (const dl of deadlines) {
      const key = format(new Date(dl.deadlineAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, { deadlines: [], level: null });
      const bucket = map.get(key)!;
      bucket.deadlines.push(dl);
      const r = computeDeadlineRisk(dl, tasks.filter((t) => t.deadlineId === dl.id), reminders);
      if (r.level === "high") bucket.level = "high";
      else if (r.level === "medium" && bucket.level !== "high") bucket.level = "medium";
      else if (!bucket.level) bucket.level = "low";
    }
    return map;
  }, [deadlines, tasks, reminders]);

  const [selected, setSelected] = useState<Date | null>(new Date());
  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : "";
  const selectedDls = dayInfo.get(selectedKey)?.deadlines ?? [];
  const selectedTasks = selected
    ? tasks.filter((t) => isSameDay(new Date(t.scheduledAt), selected))
    : [];

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your month at a glance.</p>
        </div>
        <button
          onClick={() => { setCursor(new Date()); setSelected(new Date()); }}
          className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Today
        </button>
      </header>

      <div className="mt-4 rounded-3xl border border-border bg-surface p-3 shadow-card sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setCursor(subMonths(cursor, 1))}
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            {format(cursor, "MMMM yyyy")}
          </div>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Next month"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-1">{d.slice(0, 2)}<span className="hidden sm:inline">{d.slice(2)}</span></div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const info = dayInfo.get(key);
            const dayDls = info?.deadlines ?? [];
            const level = info?.level ?? null;
            const inMonth = isSameMonth(d, cursor);
            const isSelected = selected && isSameDay(d, selected);
            const isToday = isSameDay(d, new Date());
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <button
                key={key}
                onClick={() => setSelected(d)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-start gap-1 rounded-xl p-1 text-center transition-all sm:p-1.5",
                  !inMonth && "opacity-30",
                  isSelected
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : isToday
                    ? "bg-accent ring-1 ring-primary"
                    : "hover:bg-accent",
                )}
              >
                <span className={cn(
                  "text-xs font-semibold tabular-nums sm:text-sm",
                  !isSelected && isWeekend && inMonth && "text-muted-foreground",
                )}>
                  {format(d, "d")}
                </span>
                {dayDls.length > 0 && (
                  <span
                    className={cn(
                      "mt-auto inline-flex min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums leading-tight sm:text-[10px]",
                      isSelected
                        ? "bg-white/25 text-primary-foreground"
                        : level === "high"
                        ? "bg-coral/20 text-[oklch(0.42_0.17_30)]"
                        : level === "medium"
                        ? "bg-amber-warn/25 text-amber-warn-foreground"
                        : "bg-mint/25 text-mint-foreground",
                    )}
                  >
                    {dayDls.length > 9 ? "9+" : dayDls.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-mint" /> On track</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-warn" /> At risk</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-coral" /> Urgent</span>
        </div>
      </div>

      {selected && (
        <div className="mt-4 rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo/10 text-indigo">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-semibold">{format(selected, "EEEE, d MMMM")}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedDls.length + selectedTasks.length === 0
                  ? "Nothing scheduled"
                  : `${selectedDls.length} deadline${selectedDls.length === 1 ? "" : "s"} · ${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {selectedDls.length === 0 && selectedTasks.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted/50 p-6 text-center text-sm text-muted-foreground">
              A free day. Enjoy it — or add something from the Add tab.
            </div>
          )}

          <div className="mt-3 space-y-2">
            {selectedDls.map((dl) => (
              <Link
                key={dl.id}
                to="/deadline/$id"
                params={{ id: dl.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-r from-sky/10 to-indigo/10 p-3 transition-colors hover:from-sky/20 hover:to-indigo/20"
              >
                <span className="h-10 w-1 rounded-full gradient-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo">Deadline</div>
                  <div className="truncate font-semibold">{dl.title}</div>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-border">{dl.priority}</span>
              </Link>
            ))}
            {selectedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface-muted p-3 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-indigo" />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{format(new Date(t.scheduledAt), "h:mm a")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
