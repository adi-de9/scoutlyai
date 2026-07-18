import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "done" | "blocked" | "skipped";
export type PlanningStyle = "minimal" | "balanced" | "safe" | "last_minute";

export type Profile = {
  fullName: string;
  manages: string[];
  problems: string[];
  planningStyle: PlanningStyle;
  reminderTime: string;
  reminderIntensity: string;
  workingStyle: string[];
  onboardingComplete: boolean;
};
export type Notice = {
  id: string;
  title: string;
  rawText: string;
  sourceType: string;
  status: "pending" | "analyzed" | "planned";
  createdAt: string;
};
export type Analysis = {
  title: string;
  source: string;
  mainDeadline: string;
  priority: Priority;
  confidence: number;
  documents: string[];
  instructions: string[];
  unclear: string[];
};
export type Deadline = {
  id: string;
  noticeId: string;
  title: string;
  deadlineAt: string;
  priority: Priority;
  progress: number;
  status: "active" | "complete";
};
export type Task = {
  id: string;
  deadlineId: string;
  title: string;
  description: string;
  scheduledAt: string;
  estimatedMinutes: number;
  priority: Priority;
  status: TaskStatus;
  requiredDocument?: string;
  blockerReason?: string;
  completedAt?: string;
};

const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const blankProfile: Profile = {
  fullName: "",
  manages: [],
  problems: [],
  planningStyle: "balanced",
  reminderTime: "smart",
  reminderIntensity: "balanced",
  workingStyle: [],
  onboardingComplete: false,
};
export const SAMPLE_NOTICE_TEXT =
  "All students must submit the internship application before 20 July 2026. Required documents include Aadhaar card, previous semester marksheet, passport-size photograph, and NOC from college. Late applications will not be accepted.";

const memoryValues = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (name) => memoryValues.get(name) ?? null,
  setItem: (name, value) => memoryValues.set(name, value),
  removeItem: (name) => memoryValues.delete(name),
};

function resolveStorage(): StateStorage {
  try {
    const asyncStorage = require("@react-native-async-storage/async-storage").default;
    if (!asyncStorage?.getItem || !asyncStorage?.setItem || !asyncStorage?.removeItem) {
      throw new Error("AsyncStorage native module is unavailable");
    }
    return asyncStorage as StateStorage;
  } catch {
    // Older installed dev builds may not contain the newly added native module.
    // Keep the app usable until the next rebuild; data will last for this app session only.
    return memoryStorage;
  }
}

export function analyzeNotice(rawText: string, source = "Pasted notice"): Analysis {
  const text = rawText || SAMPLE_NOTICE_TEXT;
  const lower = text.toLowerCase();
  const match = text.match(
    /(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i,
  );
  let deadline = new Date(Date.now() + 6 * 86400000);
  if (match) {
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    deadline = new Date(
      Number(match[3]),
      months.indexOf(match[2].toLowerCase()),
      Number(match[1]),
      17,
    );
    if (deadline.getTime() < Date.now()) deadline = new Date(Date.now() + 6 * 86400000);
  }
  const documents = [
    [/aadhaar|aadhar/, "Aadhaar card"],
    [/marksheet|mark sheet|transcript/, "Previous semester marksheet"],
    [/passport.*photo|photograph/, "Passport-size photograph"],
    [/noc/, "NOC from college"],
  ] as const;
  const found = documents.filter(([pattern]) => pattern.test(lower)).map(([, value]) => value);
  return {
    title: /internship/.test(lower)
      ? "Internship Application"
      : /scholarship/.test(lower)
        ? "Scholarship Application"
        : /exam|test/.test(lower)
          ? "Exam Registration"
          : "New Application",
    source,
    mainDeadline: deadline.toISOString(),
    priority: "high",
    confidence: 0.86,
    documents: found.length
      ? found
      : [
          "Aadhaar card",
          "Previous semester marksheet",
          "Passport-size photograph",
          "NOC from college",
        ],
    instructions: [
      "Complete submission before the deadline",
      "Keep original copies ready for verification",
    ],
    unclear: ["Submission location was not visible in the notice."],
  };
}

function createTasks(analysis: Analysis, deadlineId: string): Task[] {
  const items = [
    ...analysis.documents.map((document) => ({
      title: `Get ${document.toLowerCase()}`,
      description: `Collect ${document} and keep a scanned copy.`,
      requiredDocument: document,
      minutes: 45,
    })),
    {
      title: "Fill the application",
      description: "Complete all sections and double-check personal details.",
      minutes: 60,
    },
    {
      title: "Review everything",
      description: "Cross-check documents, dates, and signatures.",
      minutes: 30,
    },
    {
      title: "Submit before deadline",
      description: "Submit before the final deadline.",
      minutes: 30,
    },
  ];
  return items.map((item, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(10, 0, 0, 0);
    return {
      id: id("task"),
      deadlineId,
      title: item.title,
      description: item.description,
      scheduledAt: date.toISOString(),
      estimatedMinutes: item.minutes,
      priority: index === items.length - 1 ? "high" : "medium",
      status: "pending",
      requiredDocument: item.requiredDocument,
    };
  });
}

type DeadlineState = {
  hydrated: boolean;
  profile: Profile;
  notices: Notice[];
  analyses: Record<string, Analysis>;
  deadlines: Deadline[];
  tasks: Task[];
  setProfile: (profile: Partial<Profile>) => void;
  addNotice: (rawText: string, sourceType: string) => Notice;
  setAnalysis: (noticeId: string, analysis: Analysis) => void;
  generatePlan: (noticeId: string) => string | null;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  seedDemo: () => void;
  reset: () => void;
};

export const useDeadlineStore = create<DeadlineState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: blankProfile,
      notices: [],
      analyses: {},
      deadlines: [],
      tasks: [],
      setProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      addNotice: (rawText, sourceType) => {
        const notice: Notice = {
          id: id("notice"),
          title: "New notice",
          rawText,
          sourceType,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notices: [notice, ...state.notices] }));
        return notice;
      },
      setAnalysis: (noticeId, analysis) =>
        set((state) => ({
          analyses: { ...state.analyses, [noticeId]: analysis },
          notices: state.notices.map((notice) =>
            notice.id === noticeId
              ? { ...notice, title: analysis.title, status: "analyzed" }
              : notice,
          ),
        })),
      generatePlan: (noticeId) => {
        const analysis = get().analyses[noticeId];
        if (!analysis) return null;
        const deadlineId = id("deadline");
        const deadline: Deadline = {
          id: deadlineId,
          noticeId,
          title: analysis.title,
          deadlineAt: analysis.mainDeadline,
          priority: analysis.priority,
          progress: 0,
          status: "active",
        };
        set((state) => ({
          deadlines: [deadline, ...state.deadlines],
          tasks: [...createTasks(analysis, deadlineId), ...state.tasks],
          notices: state.notices.map((notice) =>
            notice.id === noticeId ? { ...notice, status: "planned" } : notice,
          ),
        }));
        return deadlineId;
      },
      updateTask: (taskId, patch) =>
        set((state) => {
          const tasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...patch } : task,
          );
          const changed = tasks.find((task) => task.id === taskId);
          const deadlines = changed
            ? state.deadlines.map((deadline) => {
                if (deadline.id !== changed.deadlineId) return deadline;
                const related = tasks.filter((task) => task.deadlineId === deadline.id);
                const progress = related.length
                  ? Math.round(
                      (related.filter((task) => task.status === "done").length / related.length) *
                        100,
                    )
                  : 0;
                return { ...deadline, progress, status: progress === 100 ? "complete" : "active" };
              })
            : state.deadlines;
          return { tasks, deadlines };
        }),
      seedDemo: () => {
        const notice: Notice = {
          id: id("notice"),
          title: "Internship Application",
          rawText: SAMPLE_NOTICE_TEXT,
          sourceType: "Demo notice",
          status: "planned",
          createdAt: new Date().toISOString(),
        };
        const analysis = analyzeNotice(notice.rawText, "Demo notice");
        const deadlineId = id("deadline");
        const deadline: Deadline = {
          id: deadlineId,
          noticeId: notice.id,
          title: analysis.title,
          deadlineAt: analysis.mainDeadline,
          priority: "high",
          progress: 0,
          status: "active",
        };
        set({
          profile: { ...blankProfile, fullName: "there", onboardingComplete: true },
          notices: [notice],
          analyses: { [notice.id]: analysis },
          deadlines: [deadline],
          tasks: createTasks(analysis, deadlineId),
        });
      },
      reset: () =>
        set({ profile: blankProfile, notices: [], analyses: {}, deadlines: [], tasks: [] }),
    }),
    {
      name: "deadlineos-demo",
      storage: createJSONStorage(resolveStorage),
      onRehydrateStorage: () => () => useDeadlineStore.setState({ hydrated: true }),
    },
  ),
);

export const daysLeft = (date: string) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
export function riskFor(deadline: Deadline, tasks: Task[]) {
  const remaining = tasks.filter((task) => task.status !== "done");
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const days = daysLeft(deadline.deadlineAt);
  const score = Math.min(
    100,
    (days <= 1 ? 35 : days <= 3 ? 20 : 5) +
      blocked * 25 +
      remaining.length * 7 +
      (deadline.priority === "high" ? 10 : 0),
  );
  return {
    score,
    level: score >= 55 ? ("high" as const) : score >= 25 ? ("medium" as const) : ("low" as const),
    reason: blocked
      ? `${blocked} blocked task${blocked === 1 ? "" : "s"}`
      : days <= 3
        ? "Deadline is close"
        : "On track",
  };
}
