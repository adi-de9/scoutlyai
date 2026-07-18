import { useDemoStore } from "@/lib/demo-store";
import { mockAnalyze, mockGeneratePlan, SAMPLE_NOTICE_TEXT } from "@/lib/mock-ai";
import { uid } from "@/lib/id";
import type { Notice, Deadline, Reminder } from "@/lib/schemas";

export function seedDemo() {
  const store = useDemoStore.getState();

  // Force profile if empty
  if (!store.profile.fullName) {
    store.setProfile({
      fullName: "Aditya",
      planningStyle: "safe",
      reminderTime: "smart",
      reminderIntensity: "balanced",
      manages: ["Internship applications", "College assignments"],
      problems: ["I start too late", "Documents are missing"],
      workingStyle: ["I work close to deadlines", "I often get blocked by missing documents"],
      onboardingComplete: true,
    });
  } else {
    store.setProfile({ onboardingComplete: true });
  }

  // Only seed if there are no deadlines
  if (store.deadlines.length > 0) return;

  const noticeId = uid("notice");
  const notice: Notice = {
    id: noticeId,
    title: "Internship Application",
    sourceType: "screenshot",
    rawText: SAMPLE_NOTICE_TEXT,
    fileUrl: null,
    status: "planned",
    createdAt: new Date().toISOString(),
  };
  store.addNotice(notice);

  const analysis = mockAnalyze(SAMPLE_NOTICE_TEXT, "College notice board");
  store.setAnalysis(noticeId, analysis);

  const deadlineId = uid("dl");
  const deadline: Deadline = {
    id: deadlineId,
    noticeId,
    title: analysis.title,
    description: "Submit the internship application before the deadline.",
    deadlineAt: analysis.mainDeadline,
    priority: analysis.priority,
    progress: 68,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  store.addDeadline(deadline);

  const tasks = mockGeneratePlan(analysis, deadlineId, "safe");
  // Mark first two as done so demo shows progress
  tasks[0] = { ...tasks[0]!, status: "done", completedAt: new Date().toISOString() };
  tasks[1] = { ...tasks[1]!, status: "done", completedAt: new Date().toISOString() };
  if (tasks[2]) tasks[2] = { ...tasks[2]!, status: "in_progress" };
  store.addTasks(tasks);

  // Reminders for pending tasks
  const reminders: Reminder[] = tasks
    .filter((t) => t.status !== "done")
    .map((t) => ({
      id: uid("rem"),
      taskId: t.id,
      scheduledAt: t.scheduledAt,
      status: "pending",
      response: null,
      snoozedUntil: null,
      sentAt: null,
    }));
  reminders.forEach((r) => store.addReminder(r));

  store.logActivity({
    deadlineId,
    taskId: null,
    action: "deadline_created",
    metadata: { title: analysis.title },
  });
}
