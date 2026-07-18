import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Notice, NoticeAnalysis, Deadline, Task, Reminder, ActivityLog, ChatMessage, Profile,
} from "@/lib/schemas";
import { uid } from "@/lib/id";

interface DemoState {
  profile: Profile;
  notices: Notice[];
  analyses: Record<string, NoticeAnalysis>; // by notice id
  deadlines: Deadline[];
  tasks: Task[];
  reminders: Reminder[];
  activity: ActivityLog[];
  chats: ChatMessage[];
  demoTourStep: number | null;

  setProfile: (p: Partial<Profile>) => void;
  completeOnboarding: () => void;

  addNotice: (n: Notice) => void;
  setAnalysis: (noticeId: string, a: NoticeAnalysis) => void;
  updateNotice: (id: string, patch: Partial<Notice>) => void;

  addDeadline: (d: Deadline) => void;
  updateDeadline: (id: string, patch: Partial<Deadline>) => void;

  addTasks: (t: Task[]) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  reorderTasks: (deadlineId: string, orderedIds: string[]) => void;

  addReminder: (r: Reminder) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;

  logActivity: (a: Omit<ActivityLog, "id" | "createdAt">) => void;
  addChat: (m: Omit<ChatMessage, "id" | "createdAt">) => void;

  resetDemo: () => void;
  hydrateDemo: () => void;

  setDemoTourStep: (n: number | null) => void;
}

const defaultProfile: Profile = {
  fullName: "",
  avatarUrl: null,
  manages: [],
  problems: [],
  planningStyle: "balanced",
  reminderTime: "smart",
  reminderIntensity: "balanced",
  workingStyle: [],
  onboardingComplete: false,
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      notices: [],
      analyses: {},
      deadlines: [],
      tasks: [],
      reminders: [],
      activity: [],
      chats: [],
      demoTourStep: null,

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      completeOnboarding: () => set((s) => ({ profile: { ...s.profile, onboardingComplete: true } })),

      addNotice: (n) => set((s) => ({ notices: [n, ...s.notices] })),
      setAnalysis: (noticeId, a) => set((s) => ({ analyses: { ...s.analyses, [noticeId]: a } })),
      updateNotice: (id, patch) =>
        set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),

      addDeadline: (d) => set((s) => ({ deadlines: [d, ...s.deadlines] })),
      updateDeadline: (id, patch) =>
        set((s) => ({ deadlines: s.deadlines.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      addTasks: (t) => set((s) => ({ tasks: [...s.tasks, ...t] })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      reorderTasks: (deadlineId, orderedIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.deadlineId === deadlineId ? { ...t, orderIndex: orderedIds.indexOf(t.id) } : t
          ),
        })),

      addReminder: (r) => set((s) => ({ reminders: [...s.reminders, r] })),
      updateReminder: (id, patch) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      logActivity: (a) =>
        set((s) => ({
          activity: [
            { ...a, id: uid("act"), createdAt: new Date().toISOString() },
            ...s.activity,
          ].slice(0, 500),
        })),
      addChat: (m) =>
        set((s) => ({
          chats: [...s.chats, { ...m, id: uid("chat"), createdAt: new Date().toISOString() }],
        })),

      resetDemo: () =>
        set({
          profile: defaultProfile,
          notices: [],
          analyses: {},
          deadlines: [],
          tasks: [],
          reminders: [],
          activity: [],
          chats: [],
          demoTourStep: null,
        }),

      hydrateDemo: () => {
        const state = get();
        if (state.deadlines.length > 0) return; // already have data
        // seeding happens via demo helper
      },

      setDemoTourStep: (n) => set({ demoTourStep: n }),
    }),
    {
      name: "deadlineos-demo",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        notices: s.notices,
        analyses: s.analyses,
        deadlines: s.deadlines,
        tasks: s.tasks,
        reminders: s.reminders,
        activity: s.activity,
        chats: s.chats,
      }),
    },
  ),
);

// Derived selectors
export const selectDeadlineTasks = (deadlineId: string) => (s: DemoState) =>
  s.tasks.filter((t) => t.deadlineId === deadlineId).sort((a, b) => a.orderIndex - b.orderIndex);

export const selectDeadlineReminders = (deadlineId: string) => (s: DemoState) => {
  const taskIds = new Set(s.tasks.filter((t) => t.deadlineId === deadlineId).map((t) => t.id));
  return s.reminders.filter((r) => taskIds.has(r.taskId));
};
