import type { Task, Deadline, Reminder } from "./schemas";

export interface RiskInput {
  daysRemaining: number;
  incompleteCount: number;
  blockedCount: number;
  ignoredReminders: number;
  missingDocs: number;
  totalEstimatedMinutes: number;
  priority: "low" | "medium" | "high";
}

export interface RiskResult {
  level: "low" | "medium" | "high";
  score: number; // 0-100
  reasons: string[];
}

export function computeRisk(input: RiskInput): RiskResult {
  const reasons: string[] = [];
  let score = 0;

  // Time pressure
  const workDays = input.totalEstimatedMinutes / (60 * 4); // ~4 productive hours/day
  const timePressure = workDays / Math.max(input.daysRemaining, 0.5);
  if (timePressure > 1) {
    score += 40;
    reasons.push(`Only ${input.daysRemaining} day${input.daysRemaining === 1 ? "" : "s"} left for ~${Math.ceil(workDays)} days of work`);
  } else if (timePressure > 0.6) {
    score += 20;
    reasons.push(`Tight schedule (${input.daysRemaining} days left)`);
  }

  if (input.daysRemaining <= 1) {
    score += 25;
    reasons.push("Deadline is imminent");
  } else if (input.daysRemaining <= 3) {
    score += 12;
  }

  if (input.blockedCount > 0) {
    score += 15 * input.blockedCount;
    reasons.push(`${input.blockedCount} blocked task${input.blockedCount === 1 ? "" : "s"}`);
  }

  if (input.missingDocs > 0) {
    score += 8 * input.missingDocs;
    reasons.push(`${input.missingDocs} document${input.missingDocs === 1 ? "" : "s"} missing`);
  }

  if (input.ignoredReminders >= 2) {
    score += 10;
    reasons.push(`${input.ignoredReminders} reminders ignored`);
  }

  if (input.priority === "high") score += 8;
  if (input.priority === "low") score -= 5;

  if (input.incompleteCount === 0) {
    return { level: "low", score: 0, reasons: ["All tasks complete"] };
  }

  score = Math.max(0, Math.min(100, score));

  let level: "low" | "medium" | "high" = "low";
  if (score >= 55) level = "high";
  else if (score >= 25) level = "medium";

  if (reasons.length === 0) reasons.push("On track");
  return { level, score, reasons };
}

export function computeDeadlineRisk(deadline: Deadline, tasks: Task[], reminders: Reminder[]): RiskResult {
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((new Date(deadline.deadlineAt).getTime() - now) / 86400000));
  const incomplete = tasks.filter((t) => t.status !== "done" && t.status !== "skipped");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const ignoredReminders = reminders.filter((r) => r.status === "sent" && !r.response).length;
  const missingDocs = incomplete.filter((t) => t.requiredDocument && t.status === "pending").length;
  const totalMinutes = incomplete.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return computeRisk({
    daysRemaining,
    incompleteCount: incomplete.length,
    blockedCount: blocked.length,
    ignoredReminders,
    missingDocs,
    totalEstimatedMinutes: totalMinutes,
    priority: deadline.priority,
  });
}

export function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
