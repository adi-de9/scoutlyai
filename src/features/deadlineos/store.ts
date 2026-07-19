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
  liveJobId?: string;
};
export type IntakeDraft = {
  sourceType: string;
  rawText: string;
  selectedFileName?: string;
  updatedAt: string;
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
  postponedAt?: string;
  reminderIds?: string[];
};
export type Reminder = {
  id: string;
  taskId: string;
  scheduledAt: string;
  status: "proposed" | "approved" | "scheduled" | "cancelled";
  notificationId?: string;
};
export type ActivityEvent = {
  id: string;
  taskId?: string;
  type:
    | "analyzed"
    | "plan_approved"
    | "reminder_approved"
    | "done"
    | "later"
    | "blocked"
    | "blocker_recovered";
  createdAt: string;
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

function reminderDate(scheduledAt: string, reminderTime: string) {
  const date = new Date(scheduledAt);
  const hour = reminderTime === "morning" ? 9 : reminderTime === "evening" ? 18 : 10;
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function createTasks(analysis: Analysis, deadlineId: string, planningStyle: PlanningStyle): Task[] {
  const documents =
    planningStyle === "minimal" ? analysis.documents.slice(0, 1) : analysis.documents;
  const items = [
    ...documents.map((document) => ({
      title: `Get ${document.toLowerCase()}`,
      description: `Collect ${document} and keep a scanned copy.`,
      requiredDocument: document,
      minutes: 45,
    })),
    ...(planningStyle === "safe"
      ? [
          {
            title: "Early document check",
            description: "Check every document early and replace anything missing.",
            minutes: 30,
          },
        ]
      : []),
    ...(planningStyle !== "last_minute"
      ? [
          {
            title: "Fill the application",
            description: "Complete all sections and double-check personal details.",
            minutes: 60,
          },
        ]
      : []),
    {
      title: "Review everything",
      description: "Cross-check documents, dates, and signatures.",
      minutes: 30,
    },
    ...(planningStyle === "safe"
      ? [
          {
            title: "Final safety review",
            description: "Leave one extra review before submission.",
            minutes: 25,
          },
        ]
      : []),
    ...(planningStyle === "balanced" || planningStyle === "safe"
      ? [
          {
            title: "Buffer day",
            description: "Keep this day free for any missing item or correction.",
            minutes: 15,
          },
        ]
      : []),
    {
      title: "Submit before deadline",
      description: "Submit before the final deadline.",
      minutes: 30,
    },
  ];
  const deadline = new Date(analysis.mainDeadline);
  const bufferDays = planningStyle === "safe" ? 2 : planningStyle === "balanced" ? 1 : 0;
  const firstDate = new Date(
    Math.max(Date.now(), deadline.getTime() - (items.length - 1 + bufferDays) * 86400000),
  );
  return items.map((item, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);
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
  reminders: Reminder[];
  activity: ActivityEvent[];
  intakeDraft: IntakeDraft | null;
  setProfile: (profile: Partial<Profile>) => void;
  setIntakeDraft: (draft: Omit<IntakeDraft, "updatedAt">) => void;
  clearIntakeDraft: () => void;
  addNotice: (
    rawText: string,
    sourceType: string,
    options?: Partial<Pick<Notice, "id" | "title" | "liveJobId">>,
  ) => Notice;
  setAnalysis: (noticeId: string, analysis: Analysis) => void;
  generatePlan: (noticeId: string) => string | null;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  approveReminders: (reminderIds?: string[]) => void;
  setReminderNotification: (reminderId: string, notificationId: string) => void;
  laterTask: (taskId: string) => void;
  addActivity: (event: Omit<ActivityEvent, "id" | "createdAt">) => void;
  seedDemo: () => void;
  reset: () => void;
};

type PersistedDeadlineData = Pick<
  DeadlineState,
  | "profile"
  | "notices"
  | "analyses"
  | "deadlines"
  | "tasks"
  | "reminders"
  | "activity"
  | "intakeDraft"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord<T>(value: unknown): Record<string, T> {
  return isRecord(value) ? (value as Record<string, T>) : {};
}

function strings(value: unknown): string[] {
  return asArray<unknown>(value).filter((entry): entry is string => typeof entry === "string");
}

function normalizeProfile(value: unknown): Profile {
  const profile = asRecord<unknown>(value);
  const planningStyle = profile.planningStyle;
  return {
    ...blankProfile,
    fullName: typeof profile.fullName === "string" ? profile.fullName : blankProfile.fullName,
    manages: strings(profile.manages),
    problems: strings(profile.problems),
    planningStyle:
      planningStyle === "minimal" ||
      planningStyle === "balanced" ||
      planningStyle === "safe" ||
      planningStyle === "last_minute"
        ? planningStyle
        : blankProfile.planningStyle,
    reminderTime:
      typeof profile.reminderTime === "string" ? profile.reminderTime : blankProfile.reminderTime,
    reminderIntensity:
      typeof profile.reminderIntensity === "string"
        ? profile.reminderIntensity
        : blankProfile.reminderIntensity,
    workingStyle: strings(profile.workingStyle),
    onboardingComplete:
      typeof profile.onboardingComplete === "boolean"
        ? profile.onboardingComplete
        : blankProfile.onboardingComplete,
  };
}

function normalizeIntakeDraft(value: unknown): IntakeDraft | null {
  const draft = asRecord<unknown>(value);
  if (typeof draft.sourceType !== "string" || typeof draft.rawText !== "string") return null;
  return {
    sourceType: draft.sourceType,
    rawText: draft.rawText,
    selectedFileName: typeof draft.selectedFileName === "string" ? draft.selectedFileName : undefined,
    updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : new Date().toISOString(),
  };
}

// Persisted data survives app upgrades. Normalize older or partially written state before
// any screen can read it, so a failed write from a previous build cannot crash the demo flow.
function normalizePersistedState(value: unknown): PersistedDeadlineData {
  const state = asRecord<unknown>(value);
  return {
    profile: normalizeProfile(state.profile),
    notices: asArray<Notice>(state.notices),
    analyses: asRecord<Analysis>(state.analyses),
    deadlines: asArray<Deadline>(state.deadlines),
    tasks: asArray<Task>(state.tasks),
    reminders: asArray<Reminder>(state.reminders),
    activity: asArray<ActivityEvent>(state.activity),
    intakeDraft: normalizeIntakeDraft(state.intakeDraft),
  };
}

export const useDeadlineStore = create<DeadlineState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: blankProfile,
      notices: [],
      analyses: {},
      deadlines: [],
      tasks: [],
      reminders: [],
      activity: [],
      intakeDraft: null,
      setProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      setIntakeDraft: (draft) =>
        set({ intakeDraft: { ...draft, updatedAt: new Date().toISOString() } }),
      clearIntakeDraft: () => set({ intakeDraft: null }),
      addNotice: (rawText, sourceType, options) => {
        const notice: Notice = {
          id: options?.id || id("notice"),
          title: options?.title || "New notice",
          rawText,
          sourceType,
          status: "pending",
          createdAt: new Date().toISOString(),
          liveJobId: options?.liveJobId,
        };
        set((state) => ({ notices: [notice, ...state.notices] }));
        return notice;
      },
      setAnalysis: (noticeId, analysis) =>
        set((state) => {
          const notices = asArray<Notice>(state.notices);
          const analyses = asRecord<Analysis>(state.analyses);
          return {
            analyses: { ...analyses, [noticeId]: analysis },
            notices: notices.map((notice) =>
              notice.id === noticeId
                ? { ...notice, title: analysis.title, status: "analyzed" }
                : notice,
            ),
          };
        }),
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
        set((state) => {
          const plannedTasks = createTasks(analysis, deadlineId, state.profile.planningStyle);
          return {
            deadlines: [deadline, ...state.deadlines],
            tasks: [...plannedTasks, ...state.tasks],
            reminders: [
              ...plannedTasks.map((task) => ({
                id: id("reminder"),
                taskId: task.id,
                scheduledAt: reminderDate(task.scheduledAt, state.profile.reminderTime),
                status: "proposed" as const,
              })),
              ...state.reminders,
            ],
            activity: [
              { id: id("event"), type: "plan_approved", createdAt: new Date().toISOString() },
              ...state.activity,
            ],
            notices: state.notices.map((notice) =>
              notice.id === noticeId ? { ...notice, status: "planned" } : notice,
            ),
          };
        });
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
          const task = tasks.find((item) => item.id === taskId);
          const statusChangedToDone = task?.status === "done" && patch.status === "done";
          return {
            tasks,
            deadlines,
            reminders: statusChangedToDone
              ? state.reminders.map((reminder) =>
                  reminder.taskId === taskId ? { ...reminder, status: "cancelled" } : reminder,
                )
              : state.reminders,
            activity: statusChangedToDone
              ? [
                  { id: id("event"), taskId, type: "done", createdAt: new Date().toISOString() },
                  ...state.activity,
                ]
              : state.activity,
          };
        }),
      approveReminders: (reminderIds) =>
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            !reminderIds || reminderIds.includes(reminder.id)
              ? { ...reminder, status: "approved" }
              : reminder,
          ),
          activity: [
            { id: id("event"), type: "reminder_approved", createdAt: new Date().toISOString() },
            ...state.activity,
          ],
        })),
      setReminderNotification: (reminderId, notificationId) =>
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === reminderId
              ? { ...reminder, notificationId, status: "scheduled" }
              : reminder,
          ),
        })),
      laterTask: (taskId) =>
        set((state) => {
          const time =
            state.profile.reminderTime === "evening"
              ? 18
              : state.profile.reminderTime === "morning"
                ? 9
                : 10;
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(time, 0, 0, 0);
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: "pending",
                    scheduledAt: tomorrow.toISOString(),
                    postponedAt: new Date().toISOString(),
                  }
                : task,
            ),
            reminders: state.reminders.map((reminder) =>
              reminder.taskId === taskId
                ? { ...reminder, scheduledAt: tomorrow.toISOString(), status: "approved" }
                : reminder,
            ),
            activity: [
              { id: id("event"), taskId, type: "later", createdAt: new Date().toISOString() },
              ...state.activity,
            ],
          };
        }),
      addActivity: (event) =>
        set((state) => ({
          activity: [
            { ...event, id: id("event"), createdAt: new Date().toISOString() },
            ...state.activity,
          ],
        })),
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
          tasks: createTasks(analysis, deadlineId, "balanced"),
          reminders: [],
          activity: [],
          intakeDraft: null,
        });
      },
      reset: () =>
        set({
          profile: blankProfile,
          notices: [],
          analyses: {},
          deadlines: [],
          tasks: [],
          reminders: [],
          activity: [],
          intakeDraft: null,
        }),
    }),
    {
      name: "deadlineos-demo",
      storage: createJSONStorage(resolveStorage),
      version: 2,
      migrate: (persistedState) => normalizePersistedState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(persistedState),
      }),
      onRehydrateStorage: () => () => useDeadlineStore.setState({ hydrated: true }),
    },
  ),
);

export const daysLeft = (date: string) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
export function riskFor(deadline: Deadline, tasks: Task[]) {
  const remaining = tasks.filter((task) => task.status !== "done");
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const delayed = tasks.filter((task) => task.postponedAt).length;
  const missingDocuments = tasks.filter(
    (task) => task.requiredDocument && task.status !== "done",
  ).length;
  const days = daysLeft(deadline.deadlineAt);
  const score = Math.min(
    100,
    (days <= 1 ? 35 : days <= 3 ? 20 : 5) +
      blocked * 25 +
      delayed * 8 +
      Math.min(missingDocuments, 3) * 4 +
      remaining.length * 7 +
      (deadline.priority === "high" ? 10 : 0),
  );
  return {
    score,
    level: score >= 55 ? ("high" as const) : score >= 25 ? ("medium" as const) : ("low" as const),
    reason: blocked
      ? `${blocked} blocked task${blocked === 1 ? "" : "s"}`
      : delayed
        ? `${delayed} task${delayed === 1 ? " was" : "s were"} moved later`
        : days <= 3
          ? "Deadline is close"
          : "On track",
  };
}
