import Feather from "@expo/vector-icons/Feather";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import {
  AppShell,
  C,
  Card,
  Dew,
  F,
  GradientButton,
  Header,
  OutlineButton,
  Pill,
  ProgressRing,
  RiskPill,
  Screen,
} from "./ui";
import {
  analyzeNotice,
  daysLeft,
  riskFor,
  SAMPLE_NOTICE_TEXT,
  useDeadlineStore,
  type PlanningStyle,
  type Task,
} from "./store";
import { useAuth } from "../auth/AuthProvider";
import {
  pickNoticePdf,
  pickNoticeScreenshot,
  type NoticeFileSource,
} from "./services/notice-source";
import {
  getLiveBlockerRecovery,
  readLiveAnalysis,
  readLiveJob,
  retryLiveAnalysis,
  startLiveAnalysis,
} from "./services/live-analysis";
import {
  cancelReminder,
  requestReminderPermission,
  rescheduleReminder,
  scheduleReminder,
} from "./services/reminders";

async function postponeTask(taskId: string) {
  useDeadlineStore.getState().laterTask(taskId);
  const state = useDeadlineStore.getState();
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task || !(await requestReminderPermission())) return;
  await Promise.all(
    state.reminders
      .filter((reminder) => reminder.taskId === taskId)
      .map(async (reminder) => {
        const notificationId = await rescheduleReminder(reminder, task);
        if (notificationId) state.setReminderNotification(reminder.id, notificationId);
      }),
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontFamily: F.displayBold, color: "white", fontSize: 19 },
  brand: { fontFamily: F.displayBold, color: C.text, fontSize: 20 },
  eyebrow: { fontFamily: F.medium, color: C.sub, fontSize: 12 },
  title: {
    fontFamily: F.displayBold,
    color: C.text,
    fontSize: 31,
    lineHeight: 35,
    letterSpacing: -0.6,
  },
  body: { fontFamily: F.sans, color: C.sub, fontSize: 15, lineHeight: 23 },
  row: { flexDirection: "row", alignItems: "center" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    fontFamily: F.sans,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    backgroundColor: C.surface,
    padding: 14,
    textAlignVertical: "top",
  },
  section: { marginTop: 18 },
  h2: { fontFamily: F.displayBold, color: C.text, fontSize: 20 },
  item: {
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  small: { fontFamily: F.sans, color: C.sub, fontSize: 12 },
  itemTitle: { fontFamily: F.medium, color: C.text, fontSize: 14 },
  choice: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  choiceOn: { backgroundColor: C.text, borderColor: C.text },
  floatCard: {
    position: "absolute",
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 17,
    padding: 10,
    shadowColor: C.text,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  stat: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  statNumber: { fontFamily: F.displayBold, fontSize: 24, color: C.text },
  bar: { height: 8, backgroundColor: C.muted, borderRadius: 5, overflow: "hidden" },
  calCell: {
    width: "14.285%",
    minHeight: 66,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 5,
  },
  calCellOutside: { backgroundColor: "#FBF8F2" },
  calCellSelected: { backgroundColor: "#F0ECFF", borderColor: C.indigo },
  calDayNumber: { fontFamily: F.medium, color: C.text, fontSize: 12 },
  calDayNumberToday: {
    alignSelf: "flex-start",
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: C.indigo,
    color: C.bg,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
  },
  calDots: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 7, flexWrap: "wrap" },
  calDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.coral },
  calMore: { fontFamily: F.bold, color: C.coral, fontSize: 9 },
  calAction: {
    minHeight: 36,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  calTodayAction: { paddingHorizontal: 10 },
  calActionText: { fontFamily: F.medium, color: C.indigo, fontSize: 12 },
  calendarDetail: { marginTop: 14 },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  deadlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.coral },
  calendarEmpty: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: C.muted,
    padding: 14,
    alignItems: "center",
  },
  onboardingChoiceOn: { backgroundColor: "#F0ECFF", borderColor: C.indigo, borderWidth: 2 },
  onboardingChoicePressed: { opacity: 0.84 },
  chart: { marginTop: 16 },
  chartValue: { fontFamily: F.medium, color: C.text, fontSize: 13, textAlign: "center" },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  chartDay: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 10 },
  chartDaySelected: { backgroundColor: "#FBE7E5" },
  chartDayText: { fontFamily: F.medium, color: C.sub, fontSize: 10 },
  chartDayTextSelected: { color: C.coral },
  chartEmpty: { height: 146, alignItems: "center", justifyContent: "center", gap: 8 },
  chat: { borderRadius: 16, padding: 11, maxWidth: "84%", marginTop: 8 },
});

export function LandingScreen() {
  const router = useRouter();
  const seed = useDeadlineStore((s) => s.seedDemo);
  return (
    <Screen>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.brand}>DeadlineOS</Text>
        </View>
        <OutlineButton title="Sign in" onPress={() => router.push("/sign-in")} />
      </View>
      <View style={{ marginTop: 44 }}>
        <Pill title="✦  From notice to done" />
        <Text style={[styles.title, { fontSize: 42, lineHeight: 45, marginTop: 17 }]}>
          Stop missing{"\n"}
          <Text style={{ color: C.indigo }}>important deadlines.</Text>
        </Text>
        <Text style={[styles.body, { fontSize: 17, lineHeight: 26, marginTop: 16 }]}>
          Upload any notice, screenshot, PDF, or voice note. DeadlineOS turns it into a clear plan
          and keeps you on track with smart reminders.
        </Text>
        <View style={[styles.wrap, { marginTop: 23 }]}>
          <GradientButton title="Get Started" onPress={() => router.push("/sign-in")} />
          <OutlineButton
            title="Try the Demo"
            onPress={() => {
              seed();
              router.replace("/home");
            }}
          />
        </View>
        <Text style={[styles.small, { marginTop: 12 }]}>
          No account needed for the demo. Data stays on your device.
        </Text>
      </View>
      <View style={{ height: 315, marginTop: 15, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            position: "absolute",
            height: 240,
            width: 240,
            borderRadius: 120,
            backgroundColor: "#EAE4FF",
          }}
        />
        <Dew size={270} />
        <View style={[styles.floatCard, { left: 0, top: 42 }]}>
          <Text style={styles.itemTitle}>▤ Internship Application</Text>
          <Text style={styles.small}>Deadline in 3 days</Text>
        </View>
        <View style={[styles.floatCard, { right: 0, top: 122 }]}>
          <Text style={styles.itemTitle}>♧ Get passport photo</Text>
          <Text style={styles.small}>Today · 4:30 PM</Text>
        </View>
      </View>
      <Text style={[styles.h2, { marginTop: 23 }]}>How it works</Text>
      <View style={{ gap: 12, marginTop: 14 }}>
        {[
          [
            "file-text",
            "Upload anything",
            "Screenshots, PDFs, posters, emails, or voice notes. Dew reads them all.",
          ],
          [
            "star",
            "AI extracts the plan",
            "Deadlines, documents, fees, and unclear bits get organized in seconds.",
          ],
          [
            "shield",
            "Stay on track",
            "Adaptive reminders and a blocked-task assistant help you finish on time.",
          ],
        ].map(([icon, title, body]) => (
          <Card key={title}>
            <Feather name={icon as any} color={C.indigo} size={21} />
            <Text style={[styles.h2, { fontSize: 17, marginTop: 10 }]}>{title}</Text>
            <Text style={[styles.body, { fontSize: 13, marginTop: 4 }]}>{body}</Text>
          </Card>
        ))}
      </View>
      <Text style={[styles.small, { textAlign: "center", marginVertical: 25 }]}>
        © 2026 DeadlineOS · Guided by Dew
      </Text>
    </Screen>
  );
}

const manages = [
  "College assignments",
  "Exams",
  "Internship applications",
  "Job applications",
  "Scholarships",
  "Hackathons",
  "Government forms",
  "Fees and payments",
  "Personal appointments",
  "Events",
];
const problems = [
  "I forget deadlines",
  "I start too late",
  "Instructions are confusing",
  "Documents are missing",
  "I ignore reminders",
  "I do not know the first step",
  "Information is scattered",
];
const working = [
  "I finish tasks early",
  "I work close to deadlines",
  "I need small steps",
  "I prefer one important task per day",
  "I often get blocked by missing documents",
];

const planningOptions: { id: PlanningStyle; label: string; body: string }[] = [
  { id: "minimal", label: "Minimal plan", body: "Just the essentials." },
  { id: "balanced", label: "Balanced plan", body: "Steady pacing with review time." },
  { id: "safe", label: "Safe plan", body: "Extra buffer for surprises." },
  {
    id: "last_minute",
    label: "Last-minute recovery",
    body: "Compressed steps close to deadline.",
  },
];

const reminderTimeOptions = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "smart", label: "Smart timing" },
];
const reminderIntensityOptions = [
  { id: "gentle", label: "Gentle" },
  { id: "balanced", label: "Balanced" },
  { id: "strong", label: "Strong accountability" },
];

function normalizePreference(
  value: string,
  options: { id: string; label: string }[],
  fallback: string,
) {
  const normalized = value.trim().toLowerCase();
  return (
    options.find((option) => option.id === normalized || option.label.toLowerCase() === normalized)
      ?.id ?? fallback
  );
}

function preferenceLabel(value: string, options: { id: string; label: string }[]) {
  return (
    options.find(
      (option) =>
        option.id === value.toLowerCase() || option.label.toLowerCase() === value.toLowerCase(),
    )?.label ?? value
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const setProfile = useDeadlineStore((s) => s.setProfile);
  const profile = useDeadlineStore((s) => s.profile);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => ({
    name: profile.fullName === "there" ? "" : profile.fullName,
    manages: profile.manages,
    problems: profile.problems,
    workingStyle: profile.workingStyle,
    planningStyle: profile.planningStyle,
    reminderTime: normalizePreference(profile.reminderTime, reminderTimeOptions, "smart"),
    reminderIntensity: normalizePreference(
      profile.reminderIntensity,
      reminderIntensityOptions,
      "balanced",
    ),
  }));
  const multiChoice =
    step === 1
      ? { field: "manages" as const, options: manages }
      : step === 2
        ? { field: "problems" as const, options: problems }
        : step === 5
          ? { field: "workingStyle" as const, options: working }
          : null;
  const toggle = (field: "manages" | "problems" | "workingStyle", value: string) =>
    setDraft((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  const finish = () => {
    setProfile({
      fullName: draft.name.trim() || "there",
      onboardingComplete: true,
      manages: draft.manages,
      problems: draft.problems,
      workingStyle: draft.workingStyle,
      planningStyle: draft.planningStyle,
      reminderTime: draft.reminderTime,
      reminderIntensity: draft.reminderIntensity,
    });
    router.replace("/home");
  };
  const titles = [
    "Stop missing important deadlines.",
    "What do you manage?",
    "What usually causes problems?",
    "How should DeadlineOS plan your work?",
    "When should we remind you?",
    "Your working style",
    "Building your DeadlineOS",
    "Let's organize your first deadline.",
  ];
  return (
    <Screen>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={[styles.logo, { width: 30, height: 30 }]}>
            <Text style={[styles.logoText, { fontSize: 15 }]}>D</Text>
          </View>
          <Text style={[styles.brand, { fontSize: 15 }]}>DeadlineOS</Text>
        </View>
        <View style={styles.row}>
          {Array.from({ length: 8 }, (_, i) => (
            <View
              key={i}
              style={{
                width: i <= step ? 20 : 9,
                height: 5,
                borderRadius: 3,
                backgroundColor: i <= step ? C.text : C.border,
                marginLeft: 3,
              }}
            />
          ))}
        </View>
      </View>
      <View style={{ marginTop: 42, minHeight: 420 }}>
        {step === 0 && (
          <>
            <View style={{ alignItems: "center" }}>
              <Dew size={185} />
            </View>
            <Text style={[styles.title, { textAlign: "center" }]}>{titles[0]}</Text>
            <Text style={[styles.body, { textAlign: "center", marginTop: 12 }]}>
              Upload any notice and Dew turns it into a clear plan.
            </Text>
            <TextInput
              value={draft.name}
              onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
              placeholder="What should Dew call you?"
              placeholderTextColor={C.sub}
              style={[styles.input, { marginTop: 24, textAlign: "center" }]}
            />
          </>
        )}
        {multiChoice && (
          <>
            <Text style={styles.title}>{titles[step]}</Text>
            <Text style={[styles.body, { marginTop: 7 }]}>Pick everything that applies.</Text>
            <View style={[styles.wrap, { marginTop: 25 }]}>
              {multiChoice.options.map((option) => (
                <Pill
                  key={option}
                  title={option}
                  active={draft[multiChoice.field].includes(option)}
                  onPress={() => toggle(multiChoice.field, option)}
                  activeColor={C.indigo}
                />
              ))}
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.title}>{titles[step]}</Text>
            <Text style={[styles.body, { marginTop: 7 }]}>You can change this later per task.</Text>
            <View style={{ gap: 10, marginTop: 24 }}>
              {planningOptions.map((option) => {
                const selected = draft.planningStyle === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    hitSlop={4}
                    onPress={() =>
                      setDraft((current) => ({ ...current, planningStyle: option.id }))
                    }
                    style={({ pressed }) => [
                      styles.choice,
                      selected && styles.onboardingChoiceOn,
                      pressed && styles.onboardingChoicePressed,
                    ]}
                  >
                    <View style={[styles.row, { justifyContent: "space-between", gap: 10 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{option.label}</Text>
                        <Text style={styles.small}>{option.body}</Text>
                      </View>
                      {selected && <Feather name="check-circle" color={C.indigo} size={21} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
        {step === 4 && (
          <>
            <Text style={styles.title}>{titles[step]}</Text>
            <Text style={[styles.body, { marginTop: 7 }]}>And how firmly.</Text>
            <Text style={[styles.itemTitle, { marginTop: 25, marginBottom: 9 }]}>
              Reminder time
            </Text>
            <View style={styles.wrap}>
              {reminderTimeOptions.map((option) => (
                <Pill
                  key={option.id}
                  title={option.label}
                  active={draft.reminderTime === option.id}
                  activeColor={C.indigo}
                  onPress={() => setDraft((current) => ({ ...current, reminderTime: option.id }))}
                />
              ))}
            </View>
            <Text style={[styles.itemTitle, { marginTop: 25, marginBottom: 9 }]}>
              How persistent?
            </Text>
            <View style={styles.wrap}>
              {reminderIntensityOptions.map((option) => (
                <Pill
                  key={option.id}
                  title={option.label}
                  active={draft.reminderIntensity === option.id}
                  activeColor={C.indigo}
                  onPress={() =>
                    setDraft((current) => ({ ...current, reminderIntensity: option.id }))
                  }
                />
              ))}
            </View>
          </>
        )}
        {step === 6 && (
          <>
            <View style={{ alignItems: "center" }}>
              <Dew size={180} />
            </View>
            <Text style={[styles.title, { textAlign: "center" }]}>{titles[step]}</Text>
            <Text style={[styles.body, { textAlign: "center", marginTop: 8 }]}>
              Hang tight — Dew is setting things up.
            </Text>
            {[
              "Understanding your priorities",
              "Preparing reminder style",
              "Creating task preferences",
              "Setting your deadline safety buffer",
            ].map((item, i) => (
              <Card key={item} style={{ marginTop: 10, padding: 13 }}>
                <View style={styles.row}>
                  <Feather name="check" color={C.indigo} size={18} />
                  <Text style={[styles.itemTitle, { marginLeft: 10 }]}>{item}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
        {step === 7 && (
          <>
            <View style={{ alignItems: "center" }}>
              <Dew size={180} />
            </View>
            <Text style={[styles.title, { textAlign: "center" }]}>{titles[step]}</Text>
            <Text style={[styles.body, { textAlign: "center", marginTop: 10 }]}>
              Add a screenshot, PDF, photo, pasted text, or voice note — and Dew will turn it into a
              plan.
            </Text>
          </>
        )}
      </View>
      <View
        style={[
          styles.row,
          { justifyContent: step === 0 ? "center" : "space-between", marginBottom: 18 },
        ]}
      >
        {step > 0 && (
          <OutlineButton title="Back" icon="arrow-left" onPress={() => setStep((v) => v - 1)} />
        )}
        {step === 7 ? (
          <GradientButton title="Add my first notice" onPress={finish} />
        ) : (
          <GradientButton
            title={step === 0 ? "Get Started" : step === 5 ? "Continue" : "Continue"}
            onPress={() =>
              step === 5 ? setStep(6) : step === 6 ? setStep(7) : setStep((v) => v + 1)
            }
          />
        )}
      </View>
    </Screen>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { profile, deadlines, tasks } = useDeadlineStore();
  const critical = deadlines
    .filter((d) => d.status === "active")
    .sort((a, b) => +new Date(a.deadlineAt) - +new Date(b.deadlineAt))[0];
  if (!critical)
    return (
      <AppShell>
        <Header
          title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${profile.fullName || "there"}.`}
          subtitle="Add your first notice to get started."
        />
        <Card style={{ alignItems: "center", paddingVertical: 30 }}>
          <Dew size={145} />
          <Text style={[styles.h2, { marginTop: 4 }]}>Your plan starts here</Text>
          <Text style={[styles.body, { textAlign: "center", marginVertical: 8 }]}>
            Add a notice, screenshot, PDF, or pasted text. Dew will create a clear plan.
          </Text>
          <GradientButton title="Add a notice" onPress={() => router.push("/add")} icon="plus" />
        </Card>
      </AppShell>
    );
  const related = tasks.filter((t) => t.deadlineId === critical.id);
  const risk = riskFor(critical, related);
  const next = related.find((t) => t.status !== "done");
  return (
    <AppShell>
      <Header
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${profile.fullName || "there"}.`}
        subtitle="Here is what needs your attention today."
        action={
          <Pressable onPress={() => router.push("/profile")}>
            <Feather name="user" color={C.indigo} size={21} />
          </Pressable>
        }
      />
      <Card style={{ borderTopWidth: 4, borderTopColor: C.indigo }}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>TODAY'S CRITICAL TASK</Text>
            <Text style={[styles.h2, { fontSize: 23, marginTop: 3 }]}>{critical.title}</Text>
            <Text style={[styles.small, { marginTop: 4 }]}>
              Deadline {format(new Date(critical.deadlineAt), "d MMM yyyy")} · {risk.reason}
            </Text>
          </View>
          <ProgressRing progress={critical.progress} />
        </View>
        <View style={[styles.wrap, { marginTop: 14 }]}>
          <Pill title={`${daysLeft(critical.deadlineAt)} days left`} />
          <RiskPill level={risk.level} />
        </View>
        {next && (
          <Pressable
            onPress={() => router.push(`/deadline/${critical.id}`)}
            style={[
              styles.row,
              {
                marginTop: 16,
                backgroundColor: C.muted,
                padding: 12,
                borderRadius: 16,
                justifyContent: "space-between",
              },
            ]}
          >
            <View>
              <Text style={styles.small}>NEXT STEP</Text>
              <Text style={styles.itemTitle}>{next.title}</Text>
            </View>
            <Feather name="arrow-right" color={C.indigo} size={18} />
          </Pressable>
        )}
      </Card>
      <View style={styles.section}>
        <Text style={styles.h2}>Upcoming deadlines</Text>
        {deadlines
          .filter((d) => d.id !== critical.id)
          .slice(0, 3)
          .map((d) => (
            <Pressable key={d.id} onPress={() => router.push(`/deadline/${d.id}`)}>
              <Card style={{ marginTop: 10 }}>
                <Text style={styles.itemTitle}>{d.title}</Text>
                <Text style={styles.small}>{daysLeft(d.deadlineAt)} days left</Text>
              </Card>
            </Pressable>
          ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.h2}>Dew's suggestions</Text>
        <Card style={{ marginTop: 10 }}>
          <View style={styles.row}>
            <Dew size={58} />
            <Text style={[styles.body, { flex: 1 }]}>
              Start with the smallest next step. It makes the rest of the plan feel much easier.
            </Text>
          </View>
        </Card>
      </View>
    </AppShell>
  );
}

export function AddScreen() {
  const router = useRouter();
  const addNotice = useDeadlineStore((s) => s.addNotice);
  const [source, setSource] = useState("Pasted text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<NoticeFileSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const choose = async (next: string) => {
    setSource(next);
    setFile(null);
    setError(null);
    if (next === "Pasted text") return;
    try {
      const selected = next === "PDF" ? await pickNoticePdf() : await pickNoticeScreenshot();
      if (selected) setFile(selected);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not choose that file.");
    }
  };
  const fillDemoSample = () => {
    setSource("Pasted text");
    setFile(null);
    setText(SAMPLE_NOTICE_TEXT);
    setError(null);
  };
  const submit = async () => {
    if (source === "Pasted text" && !text.trim())
      return setError("Paste the notice text before extracting deadlines.");
    if (source !== "Pasted text" && !file)
      return setError("Choose a file before extracting deadlines.");
    setBusy(true);
    setError(null);
    try {
      const result = await startLiveAnalysis({
        text: source === "Pasted text" ? text : undefined,
        file: source === "Pasted text" ? undefined : file || undefined,
      });
      addNotice(result.notice.rawText, result.notice.sourceType, result.notice);
      router.push(`/analysis/${result.notice.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start live analysis.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell>
      <Header title="Add a notice" subtitle="Choose a source, then extract the important dates." />
      <View style={[styles.wrap, { justifyContent: "space-between", marginBottom: 14 }]}>
        {[
          ["file-text", "PDF"],
          ["image", "Screenshot"],
          ["type", "Pasted text"],
        ].map(([icon, label]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected: source === label }}
            accessibilityLabel={`Use ${label} as the notice source`}
            onPress={() => void choose(label)}
            style={[
              styles.choice,
              source === label && styles.choiceOn,
              {
                alignItems: "center",
                flex: 1,
                minHeight: 68,
                paddingHorizontal: 7,
                paddingVertical: 10,
              },
            ]}
          >
            <Feather name={icon as any} color={source === label ? C.bg : C.indigo} size={20} />
            <Text style={[styles.small, source === label && { color: C.bg }, { marginTop: 4 }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Card>
        {source === "Pasted text" && (
          <>
            <Text style={styles.h2}>What does the notice say?</Text>
            <Text style={[styles.small, { marginTop: 4 }]}>
              Paste text from a notice, email, or message.
            </Text>
            <TextInput
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Paste the notice here. Include the deadline, documents needed, and where to submit."
              placeholderTextColor={C.sub}
              style={[styles.input, { height: 155, marginTop: 14, textAlignVertical: "top" }]}
            />
          </>
        )}
        {source !== "Pasted text" && (
          <>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: "#EEF0FF" }]}>
                <Feather
                  name={source === "PDF" ? "file-text" : "image"}
                  color={C.indigo}
                  size={20}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.h2}>
                  {file ? file.name : `Choose a ${source.toLowerCase()}`}
                </Text>
                <Text style={[styles.small, { marginTop: 4 }]}>
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(1)} MB ready to extract`
                    : "Maximum size: 10 MB"}
                </Text>
              </View>
            </View>
            <View style={[styles.wrap, { marginTop: 14 }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void choose(source)}
                style={[styles.choice, { alignItems: "center", flex: 1, paddingVertical: 11 }]}
              >
                <Text style={[styles.itemTitle, { color: C.indigo }]}>
                  {file ? "Change file" : `Choose ${source}`}
                </Text>
              </Pressable>
              {file && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected file"
                  onPress={() => setFile(null)}
                  style={[
                    styles.choice,
                    { alignItems: "center", paddingHorizontal: 16, paddingVertical: 11 },
                  ]}
                >
                  <Feather name="x" color={C.sub} size={18} />
                </Pressable>
              )}
            </View>
          </>
        )}
        {error && <Text style={[styles.body, { color: C.coral, marginTop: 12 }]}>{error}</Text>}
        <View style={[styles.row, { gap: 7, marginTop: 15 }]}>
          <Feather name="shield" color={C.mint} size={15} />
          <Text style={styles.small}>Live analysis is private. Demo Mode never uploads.</Text>
        </View>
        <View style={{ marginTop: 13 }}>
          <GradientButton
            title={busy ? "Starting analysis…" : "Extract deadlines"}
            icon="star"
            onPress={() => void submit()}
            disabled={busy || (source === "Pasted text" ? !text.trim() : !file)}
          />
        </View>
        {source === "Pasted text" && (
          <View style={{ marginTop: 10 }}>
            <OutlineButton title="Fill sample text" icon="file-text" onPress={fillDemoSample} />
          </View>
        )}
      </Card>
    </AppShell>
  );
}

export function AnalysisScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = useDeadlineStore((s) => s.notices.find((n) => n.id === id));
  const analysis = useDeadlineStore((s) => s.analyses[id]);
  const setAnalysis = useDeadlineStore((s) => s.setAnalysis);
  const generatePlan = useDeadlineStore((s) => s.generatePlan);
  const reminders = useDeadlineStore((s) => s.reminders);
  const tasks = useDeadlineStore((s) => s.tasks);
  const approveReminders = useDeadlineStore((s) => s.approveReminders);
  const setReminderNotification = useDeadlineStore((s) => s.setReminderNotification);
  const [stage, setStage] = useState(0);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [planDeadlineId, setPlanDeadlineId] = useState<string | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDeadline, setDraftDeadline] = useState("");
  const [draftDocuments, setDraftDocuments] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  useEffect(() => {
    if (!planDeadlineId || selectedReminders.length) return;
    const taskIds = tasks
      .filter((task) => task.deadlineId === planDeadlineId)
      .map((task) => task.id);
    setSelectedReminders(
      reminders
        .filter((reminder) => taskIds.includes(reminder.taskId))
        .map((reminder) => reminder.id),
    );
  }, [planDeadlineId, reminders, selectedReminders.length, tasks]);
  useEffect(() => {
    if (analysis || !notice) return;
    if (notice.liveJobId) {
      let active = true;
      const refresh = async () => {
        try {
          const job = await readLiveJob(notice.liveJobId!);
          if (!active || !job) return;
          setLiveStatus(job.status);
          if (job.status === "awaiting_approval" || job.status === "completed") {
            const extracted = await readLiveAnalysis(notice.id);
            if (extracted && active) setAnalysis(notice.id, extracted);
          }
          if (job.status === "failed" && active)
            setLiveError(
              job.error_message || "Live analysis failed. Retry or use the demo sample.",
            );
        } catch (reason) {
          if (active)
            setLiveError(
              reason instanceof Error ? reason.message : "Could not refresh live analysis.",
            );
        }
      };
      void refresh();
      const timer = setInterval(() => void refresh(), 1800);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }
    const timer = setInterval(
      () =>
        setStage((s) => {
          if (s >= 5) {
            clearInterval(timer);
            setAnalysis(notice.id, analyzeNotice(notice.rawText, notice.sourceType));
            return s;
          }
          return s + 1;
        }),
      550,
    );
    return () => clearInterval(timer);
  }, [analysis, notice, setAnalysis]);
  const startReview = () => {
    if (!analysis) return;
    setDraftTitle(analysis.title);
    setDraftDeadline(format(new Date(analysis.mainDeadline), "yyyy-MM-dd"));
    setDraftDocuments(analysis.documents);
    setNewDocument("");
    setReviewError(null);
    setIsReviewing(true);
  };
  const createPlanFromReview = () => {
    if (!analysis) return;
    const title = draftTitle.trim();
    const deadline = new Date(`${draftDeadline}T17:00:00`);
    if (!title) return setReviewError("Add a title before creating the plan.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draftDeadline) || Number.isNaN(deadline.getTime()))
      return setReviewError("Use a valid deadline in YYYY-MM-DD format.");
    setAnalysis(id, {
      ...analysis,
      title,
      mainDeadline: deadline.toISOString(),
      documents: draftDocuments,
    });
    const deadlineId = generatePlan(id);
    if (deadlineId) {
      setPlanDeadlineId(deadlineId);
      const taskIds = tasks.filter((task) => task.deadlineId === deadlineId).map((task) => task.id);
      setSelectedReminders(
        reminders
          .filter((reminder) => taskIds.includes(reminder.taskId))
          .map((reminder) => reminder.id),
      );
    }
  };
  const progressLabels = [
    "Preparing your notice",
    "Reading the details",
    "Extracting deadlines",
    "Building your plan",
  ];
  const liveProgress = {
    queued: 0,
    reading: 1,
    extracting: 2,
    planning: 3,
    awaiting_approval: 3,
    completed: 3,
  } as Record<string, number>;
  const progressStep = notice?.liveJobId
    ? (liveProgress[liveStatus || "queued"] ?? 0)
    : Math.min(stage, 3);
  if (!notice)
    return (
      <AppShell>
        <Card>
          <Text style={styles.body}>Notice not found.</Text>
        </Card>
      </AppShell>
    );
  if (!analysis)
    return (
      <AppShell>
        <View style={{ alignItems: "center", paddingTop: 18 }}>
          <Dew size={170} />
          <Text style={[styles.title, { textAlign: "center" }]}>Analyzing your notice</Text>
          <Text style={[styles.body, { textAlign: "center", marginTop: 7 }]}>
            Dew is reading carefully — this takes a few seconds.
          </Text>
          {notice.liveJobId && (
            <Text style={[styles.small, { textAlign: "center", marginTop: 5 }]}>
              Live analysis: {liveStatus || "queued"}
            </Text>
          )}
          <Card style={{ marginTop: 25, width: "100%" }}>
            <View style={styles.row}>
              <Feather
                name={liveStatus === "failed" ? "alert-circle" : "loader"}
                color={C.indigo}
                size={19}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemTitle}>{progressLabels[progressStep]}</Text>
                <Text style={[styles.small, { marginTop: 3 }]}>
                  Step {progressStep + 1} of {progressLabels.length}
                </Text>
              </View>
            </View>
            <View style={[styles.row, { gap: 6, marginTop: 16 }]}>
              {progressLabels.map((label, index) => (
                <View
                  key={label}
                  style={{
                    backgroundColor: index <= progressStep ? C.indigo : C.border,
                    borderRadius: 4,
                    flex: 1,
                    height: 7,
                  }}
                />
              ))}
            </View>
          </Card>
          {liveError && (
            <Card style={{ marginTop: 15, backgroundColor: "#FDE9E7" }}>
              <Text style={[styles.body, { color: C.coral }]}>{liveError}</Text>
              <View style={{ marginTop: 10 }}>
                <GradientButton
                  title="Retry live analysis"
                  onPress={() =>
                    notice.liveJobId &&
                    void retryLiveAnalysis(notice.liveJobId)
                      .then(() => setLiveError(null))
                      .catch((reason) =>
                        setLiveError(reason instanceof Error ? reason.message : "Retry failed"),
                      )
                  }
                />
                <View style={{ marginTop: 8 }}>
                  <OutlineButton
                    title="Use demo sample"
                    onPress={() => {
                      setAnalysis(notice.id, analyzeNotice(SAMPLE_NOTICE_TEXT, "Demo sample"));
                      setLiveError(null);
                    }}
                  />
                </View>
              </View>
            </Card>
          )}
        </View>
      </AppShell>
    );
  return (
    <AppShell>
      <Header title="Extracted notice" subtitle={analysis.source} />
      <Card>
        <Text style={styles.eyebrow}>AI CONFIDENCE · {Math.round(analysis.confidence * 100)}%</Text>
        <Text style={[styles.title, { fontSize: 27, marginTop: 4 }]}>{analysis.title}</Text>
        <View style={[styles.row, { gap: 9, marginTop: 16 }]}>
          <Card
            style={{
              flex: 1,
              padding: 13,
              backgroundColor: daysLeft(analysis.mainDeadline) <= 7 ? "#FDE9E7" : C.muted,
            }}
          >
            <Text style={styles.small}>MAIN DEADLINE</Text>
            <Text style={[styles.itemTitle, { marginTop: 4 }]}>
              {format(new Date(analysis.mainDeadline), "d MMMM yyyy")}
            </Text>
            <Text style={[styles.small, { color: C.coral }]}>
              {daysLeft(analysis.mainDeadline)} days remaining
            </Text>
          </Card>
          <Card style={{ flex: 1, padding: 13, backgroundColor: C.muted }}>
            <Text style={styles.small}>PRIORITY</Text>
            <Text style={[styles.itemTitle, { textTransform: "capitalize", marginTop: 4 }]}>
              {analysis.priority}
            </Text>
          </Card>
        </View>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Text style={styles.h2}>Required documents</Text>
        {analysis.documents.map((document) => (
          <View key={document} style={styles.item}>
            <Feather name="square" color={C.sub} size={18} />
            <Text style={styles.itemTitle}>{document}</Text>
          </View>
        ))}
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Text style={styles.h2}>Important instructions</Text>
        {analysis.instructions.map((value) => (
          <Text key={value} style={[styles.body, { marginTop: 8 }]}>
            • {value}
          </Text>
        ))}
      </Card>
      <Card style={{ marginTop: 12, backgroundColor: "#FFF4D7" }}>
        <Text style={styles.h2}>Missing or uncertain information</Text>
        {analysis.unclear.map((value) => (
          <Text key={value} style={[styles.body, { marginTop: 7, color: "#765218" }]}>
            • {value}
          </Text>
        ))}
      </Card>
      {!planDeadlineId ? (
        <View style={{ marginVertical: 18 }}>
          {!isReviewing ? (
            <GradientButton title="Review extraction" icon="edit-3" onPress={startReview} />
          ) : (
            <Card style={{ backgroundColor: "#EEF0FF" }}>
              <Text style={styles.h2}>Quick review</Text>
              <Text style={[styles.small, { marginTop: 4 }]}>
                Correct anything before Deadline OS creates your plan.
              </Text>
              <Text style={[styles.small, { marginTop: 16 }]}>NOTICE TITLE</Text>
              <TextInput
                value={draftTitle}
                onChangeText={setDraftTitle}
                style={[styles.input, { marginTop: 6 }]}
              />
              <Text style={[styles.small, { marginTop: 14 }]}>DEADLINE (YYYY-MM-DD)</Text>
              <TextInput
                value={draftDeadline}
                onChangeText={setDraftDeadline}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                style={[styles.input, { marginTop: 6 }]}
              />
              <Text style={[styles.small, { marginTop: 14 }]}>REQUIRED DOCUMENTS</Text>
              <View style={[styles.wrap, { marginTop: 8 }]}>
                {draftDocuments.map((document) => (
                  <Pressable
                    key={document}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${document}`}
                    onPress={() =>
                      setDraftDocuments((items) => items.filter((item) => item !== document))
                    }
                    style={[
                      styles.choice,
                      { flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
                    ]}
                  >
                    <Text style={styles.small}>{document}</Text>
                    <Feather name="x" color={C.sub} size={14} />
                  </Pressable>
                ))}
              </View>
              <View style={[styles.row, { gap: 8, marginTop: 10 }]}>
                <TextInput
                  value={newDocument}
                  onChangeText={setNewDocument}
                  placeholder="Add a document"
                  placeholderTextColor={C.sub}
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const document = newDocument.trim();
                    if (document && !draftDocuments.includes(document))
                      setDraftDocuments((items) => [...items, document]);
                    setNewDocument("");
                  }}
                  style={[styles.choice, { padding: 14 }]}
                >
                  <Feather name="plus" color={C.indigo} size={18} />
                </Pressable>
              </View>
              {reviewError && (
                <Text style={[styles.body, { color: C.coral, marginTop: 10 }]}>{reviewError}</Text>
              )}
              <View style={{ marginTop: 14 }}>
                <GradientButton
                  title="Create plan"
                  icon="arrow-right"
                  onPress={createPlanFromReview}
                />
              </View>
              <View style={{ marginTop: 8 }}>
                <OutlineButton title="Cancel review" onPress={() => setIsReviewing(false)} />
              </View>
            </Card>
          )}
        </View>
      ) : (
        <Card style={{ marginVertical: 18, backgroundColor: "#EEF0FF" }}>
          <Text style={styles.h2}>Approve reminders</Text>
          <Text style={[styles.body, { marginTop: 5 }]}>
            Choose reminders you want on this phone. You can change them later.
          </Text>
          {reminders
            .filter((reminder) =>
              tasks.some(
                (task) => task.id === reminder.taskId && task.deadlineId === planDeadlineId,
              ),
            )
            .map((reminder) => {
              const task = tasks.find((item) => item.id === reminder.taskId)!;
              const selected = selectedReminders.includes(reminder.id);
              return (
                <Pressable
                  key={reminder.id}
                  onPress={() =>
                    setSelectedReminders((current) =>
                      selected
                        ? current.filter((item) => item !== reminder.id)
                        : [...current, reminder.id],
                    )
                  }
                  style={[styles.item, { marginTop: 10 }]}
                >
                  <Feather
                    name={selected ? "check-square" : "square"}
                    color={selected ? C.indigo : C.sub}
                    size={20}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{task.title}</Text>
                    <Text style={styles.small}>
                      {format(new Date(reminder.scheduledAt), "EEE, d MMM · p")}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          <View style={{ marginTop: 14 }}>
            <GradientButton
              title="Approve selected & continue"
              onPress={() =>
                void (async () => {
                  approveReminders(selectedReminders);
                  if (selectedReminders.length && (await requestReminderPermission())) {
                    await Promise.all(
                      selectedReminders.map(async (reminderId) => {
                        const reminder = reminders.find((item) => item.id === reminderId);
                        const task = reminder && tasks.find((item) => item.id === reminder.taskId);
                        if (reminder && task) {
                          const notificationId = await scheduleReminder(reminder, task);
                          if (notificationId) setReminderNotification(reminder.id, notificationId);
                        }
                      }),
                    );
                  }
                  router.replace(`/deadline/${planDeadlineId}`);
                })()
              }
            />
          </View>
        </Card>
      )}
    </AppShell>
  );
}

export function DeadlineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines, tasks, reminders, updateTask } = useDeadlineStore();
  const deadline = deadlines.find((d) => d.id === id);
  if (!deadline)
    return (
      <AppShell>
        <Card>
          <Text style={styles.body}>Deadline not found.</Text>
        </Card>
      </AppShell>
    );
  const list = tasks.filter((t) => t.deadlineId === id);
  const risk = riskFor(deadline, list);
  return (
    <AppShell>
      <OutlineButton title="Back" icon="arrow-left" onPress={() => router.replace("/home")} />
      <Card style={{ marginTop: 14 }}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.small}>
              {format(new Date(deadline.deadlineAt), "d MMM yyyy")} ·{" "}
              {daysLeft(deadline.deadlineAt)} days left
            </Text>
            <Text style={[styles.title, { fontSize: 26, marginTop: 4 }]}>{deadline.title}</Text>
            <RiskPill level={risk.level} />
          </View>
          <ProgressRing progress={deadline.progress} size={95} />
        </View>
      </Card>
      <Text style={[styles.h2, { marginTop: 20 }]}>Your plan</Text>
      {list.map((task) => (
        <Card key={task.id} style={{ marginTop: 9, opacity: task.status === "done" ? 0.62 : 1 }}>
          <View style={[styles.row, { justifyContent: "space-between", gap: 10 }]}>
            <Pressable
              onPress={() => {
                const isDone = task.status === "done";
                updateTask(task.id, {
                  status: isDone ? "pending" : "done",
                  completedAt: isDone ? undefined : new Date().toISOString(),
                });
                if (!isDone)
                  reminders
                    .filter((reminder) => reminder.taskId === task.id)
                    .forEach((reminder) => void cancelReminder(reminder.notificationId));
              }}
            >
              <Feather
                name={task.status === "done" ? "check-square" : "square"}
                color={task.status === "done" ? C.mint : C.sub}
                size={22}
              />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.itemTitle,
                  task.status === "done" && { textDecorationLine: "line-through" },
                ]}
              >
                {task.title}
              </Text>
              <Text style={styles.small}>
                {task.estimatedMinutes} min · {format(new Date(task.scheduledAt), "EEE, d MMM")}
              </Text>
            </View>
            {task.status !== "done" && (
              <View style={[styles.row, { gap: 12 }]}>
                <Pressable
                  accessibilityLabel={`Do ${task.title} later`}
                  onPress={() => void postponeTask(task.id)}
                >
                  <Feather name="clock" color={C.indigo} size={20} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Report ${task.title} as blocked`}
                  onPress={() => router.push(`/blocked/${task.id}`)}
                >
                  <Feather name="alert-circle" color={C.coral} size={20} />
                </Pressable>
              </View>
            )}
          </View>
        </Card>
      ))}
    </AppShell>
  );
}

export function TasksScreen() {
  const { tasks, deadlines, reminders, updateTask } = useDeadlineStore();
  const [filter, setFilter] = useState<"all" | "pending" | "done" | "blocked">("all");
  const list = tasks.filter((task) => filter === "all" || task.status === filter);
  return (
    <AppShell>
      <Header title="Tasks" subtitle="Small steps make deadlines manageable." />
      <View style={styles.wrap}>
        {(["all", "pending", "done", "blocked"] as const).map((value) => (
          <Pill
            key={value}
            title={value}
            active={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>
      {list.length ? (
        list.map((task) => (
          <Card key={task.id} style={{ marginTop: 10 }}>
            <View style={[styles.row, { gap: 10 }]}>
              <Pressable
                onPress={() => {
                  const isDone = task.status === "done";
                  updateTask(task.id, {
                    status: isDone ? "pending" : "done",
                    completedAt: isDone ? undefined : new Date().toISOString(),
                  });
                  if (!isDone)
                    reminders
                      .filter((reminder) => reminder.taskId === task.id)
                      .forEach((reminder) => void cancelReminder(reminder.notificationId));
                }}
              >
                <Feather
                  name={
                    task.status === "done"
                      ? "check-square"
                      : task.status === "blocked"
                        ? "alert-triangle"
                        : "square"
                  }
                  color={
                    task.status === "blocked" ? C.coral : task.status === "done" ? C.mint : C.sub
                  }
                  size={21}
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.small}>
                  {deadlines.find((d) => d.id === task.deadlineId)?.title} ·{" "}
                  {format(new Date(task.scheduledAt), "EEE, d MMM")}
                </Text>
              </View>
              {task.status !== "done" && (
                <Pressable
                  accessibilityLabel={`Do ${task.title} later`}
                  onPress={() => void postponeTask(task.id)}
                >
                  <Feather name="clock" color={C.indigo} size={20} />
                </Pressable>
              )}
            </View>
          </Card>
        ))
      ) : (
        <Card style={{ marginTop: 15, alignItems: "center" }}>
          <Text style={styles.body}>No {filter} tasks yet.</Text>
        </Card>
      )}
    </AppShell>
  );
}

export function CalendarScreen() {
  const router = useRouter();
  const deadlines = useDeadlineStore((s) => s.deadlines);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const start = startOfWeek(startOfMonth(month));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const deadlinesByDate = useMemo(() => {
    const grouped = new Map<string, typeof deadlines>();
    deadlines.forEach((deadline) => {
      const key = format(new Date(deadline.deadlineAt), "yyyy-MM-dd");
      grouped.set(key, [...(grouped.get(key) ?? []), deadline]);
    });
    return grouped;
  }, [deadlines]);
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDeadlines = deadlinesByDate.get(selectedKey) ?? [];
  const selectDay = (day: Date) => {
    setSelectedDate(startOfDay(day));
    if (!isSameMonth(day, month)) setMonth(startOfMonth(day));
  };
  const resetToToday = () => {
    const today = startOfDay(new Date());
    setMonth(startOfMonth(today));
    setSelectedDate(today);
  };
  return (
    <AppShell>
      <Header
        title="Calendar"
        subtitle={format(month, "MMMM yyyy")}
        action={
          <View style={[styles.row, { gap: 6 }]}>
            <Pressable
              accessibilityLabel="Show today"
              hitSlop={4}
              onPress={resetToToday}
              style={[styles.calAction, styles.calTodayAction]}
            >
              <Text style={styles.calActionText}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Previous month"
              hitSlop={4}
              onPress={() => setMonth((current) => subMonths(current, 1))}
              style={styles.calAction}
            >
              <Feather name="chevron-left" size={22} color={C.indigo} />
            </Pressable>
            <Pressable
              accessibilityLabel="Next month"
              hitSlop={4}
              onPress={() => setMonth((current) => addMonths(current, 1))}
              style={styles.calAction}
            >
              <Feather name="chevron-right" size={22} color={C.indigo} />
            </Pressable>
          </View>
        }
      />
      <View style={[styles.row, { marginBottom: 5 }]}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={[styles.small, { width: "14.285%", textAlign: "center" }]}>
            {d}
          </Text>
        ))}
      </View>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = deadlinesByDate.get(key) ?? [];
            const selected = isSameDay(day, selectedDate);
            const outsideMonth = !isSameMonth(day, month);
            const today = isToday(day);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${format(day, "EEEE, d MMMM")}${items.length ? `, ${items.length} deadline${items.length === 1 ? "" : "s"}` : ", no deadlines"}`}
                hitSlop={2}
                onPress={() => selectDay(day)}
                style={[
                  styles.calCell,
                  outsideMonth && styles.calCellOutside,
                  selected && styles.calCellSelected,
                ]}
              >
                <Text
                  style={[
                    styles.calDayNumber,
                    today && styles.calDayNumberToday,
                    outsideMonth && { opacity: 0.42 },
                  ]}
                >
                  {format(day, "d")}
                </Text>
                {items.length > 0 && (
                  <View style={styles.calDots}>
                    {items.slice(0, 3).map((item) => (
                      <View key={item.id} style={styles.calDot} />
                    ))}
                    {items.length > 3 && <Text style={styles.calMore}>+{items.length - 3}</Text>}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card style={styles.calendarDetail}>
        <Text style={styles.h2}>
          {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, d MMMM")}
        </Text>
        <Text style={[styles.small, { marginTop: 3 }]}>
          {selectedDeadlines.length
            ? `${selectedDeadlines.length} deadline${selectedDeadlines.length === 1 ? "" : "s"} to review`
            : "Nothing is due on this day."}
        </Text>
        {selectedDeadlines.length ? (
          selectedDeadlines.map((deadline) => (
            <Pressable
              key={deadline.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${deadline.title}`}
              hitSlop={4}
              onPress={() => router.push(`/deadline/${deadline.id}`)}
              style={({ pressed }) => [styles.deadlineRow, pressed && { opacity: 0.72 }]}
            >
              <View style={styles.deadlineDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{deadline.title}</Text>
                <Text style={styles.small}>{format(new Date(deadline.deadlineAt), "h:mm a")}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={C.indigo} />
            </Pressable>
          ))
        ) : (
          <View style={styles.calendarEmpty}>
            <Feather name="calendar" size={20} color={C.sub} />
            <Text style={styles.small}>Choose another day or add a new notice.</Text>
          </View>
        )}
      </Card>
    </AppShell>
  );
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 164;
const CHART_PADDING_X = 18;
const CHART_PADDING_Y = 18;

function sevenDayActivity(tasks: Task[]) {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return {
      date,
      count: tasks.filter(
        (task) =>
          task.status === "done" && task.completedAt && isSameDay(new Date(task.completedAt), date),
      ).length,
    };
  });
}

export function InsightsScreen() {
  const tasks = useDeadlineStore((s) => s.tasks);
  const deadlines = useDeadlineStore((s) => s.deadlines);
  const complete = tasks.filter((t) => t.status === "done").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const activity = useMemo(() => sevenDayActivity(tasks), [tasks]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const maxCount = Math.max(...activity.map((day) => day.count));
  const hasActivity = maxCount > 0;
  const selectedDay = activity[selectedDayIndex] ?? activity[6];
  const chartBottom = CHART_HEIGHT - CHART_PADDING_Y;
  const chartHeight = chartBottom - CHART_PADDING_Y;
  const chartWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const points = activity.map((day, index) => ({
    x: CHART_PADDING_X + (chartWidth * index) / (activity.length - 1),
    y: chartBottom - (day.count / Math.max(maxCount, 1)) * chartHeight,
  }));
  const linePath = points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? chartBottom} ${chartBottom} L ${points[0]?.x ?? CHART_PADDING_X} ${chartBottom} Z`;
  const datedCompletedCount = tasks.filter(
    (task) => task.status === "done" && task.completedAt,
  ).length;
  const legacyCompletedCount = complete - datedCompletedCount;

  return (
    <AppShell>
      <Header title="Insights" subtitle="Your progress, one small win at a time." />
      <View style={[styles.row, { gap: 10 }]}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{complete}</Text>
          <Text style={styles.small}>tasks completed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{deadlines.length}</Text>
          <Text style={styles.small}>active deadlines</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: blocked ? C.coral : C.mint }]}>{blocked}</Text>
          <Text style={styles.small}>blocked tasks</Text>
        </View>
      </View>
      <Card style={{ marginTop: 14 }}>
        <Text style={styles.h2}>This week's momentum</Text>
        <Text style={[styles.body, { marginTop: 5 }]}>
          Your completed tasks over the last seven days.
        </Text>
        {hasActivity ? (
          <View style={styles.chart}>
            <Text style={styles.chartValue}>
              {format(selectedDay.date, "EEE, d MMM")} · {selectedDay.count} completed task
              {selectedDay.count === 1 ? "" : "s"}
            </Text>
            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
              <Defs>
                <SvgLinearGradient id="momentumFill" x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0" stopColor={C.coral} stopOpacity="0.28" />
                  <Stop offset="1" stopColor={C.coral} stopOpacity="0.02" />
                </SvgLinearGradient>
              </Defs>
              {[0.25, 0.5, 0.75].map((position) => {
                const y = CHART_PADDING_Y + chartHeight * position;
                return (
                  <Line
                    key={position}
                    x1={CHART_PADDING_X}
                    x2={CHART_WIDTH - CHART_PADDING_X}
                    y1={y}
                    y2={y}
                    stroke={C.border}
                    strokeDasharray="4 5"
                  />
                );
              })}
              <Path d={areaPath} fill="url(#momentumFill)" />
              <Path
                d={linePath}
                fill="none"
                stroke={C.coral}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((point, index) => (
                <Circle
                  key={activity[index]?.date.toISOString()}
                  cx={point.x}
                  cy={point.y}
                  r={index === selectedDayIndex ? 6 : 4.5}
                  fill={C.surface}
                  stroke={C.coral}
                  strokeWidth={3}
                />
              ))}
            </Svg>
            <View style={styles.chartLabels}>
              {activity.map((day, index) => {
                const selected = index === selectedDayIndex;
                return (
                  <Pressable
                    key={day.date.toISOString()}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${format(day.date, "EEEE")}, ${day.count} completed tasks`}
                    hitSlop={3}
                    onPress={() => setSelectedDayIndex(index)}
                    style={[styles.chartDay, selected && styles.chartDaySelected]}
                  >
                    <Text style={[styles.chartDayText, selected && styles.chartDayTextSelected]}>
                      {format(day.date, "EEEEE")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.chartEmpty}>
            <Feather name="activity" size={26} color={C.coral} />
            <Text style={[styles.body, { textAlign: "center" }]}>
              Complete a task to start your seven-day momentum graph.
            </Text>
          </View>
        )}
        {legacyCompletedCount > 0 && (
          <Text style={[styles.small, { marginTop: 10, textAlign: "center" }]}>
            {legacyCompletedCount} earlier completed task{legacyCompletedCount === 1 ? "" : "s"} is
            included in your total, but has no completion date for this graph.
          </Text>
        )}
      </Card>
      <Card style={{ marginTop: 14 }}>
        <View style={styles.row}>
          <Dew size={78} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>Dew says</Text>
            <Text style={styles.body}>
              You are building a habit of finishing what matters. Keep the next task tiny and clear.
            </Text>
          </View>
        </View>
      </Card>
    </AppShell>
  );
}

export function ProfileScreen() {
  const { profile, seedDemo } = useDeadlineStore();
  const { signOut } = useAuth();
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  return (
    <AppShell>
      <Header title="Profile" subtitle="Your DeadlineOS preferences." />
      <Card style={{ alignItems: "center" }}>
        <Dew size={125} />
        <Text style={[styles.h2, { marginTop: 4 }]}>{profile.fullName || "DeadlineOS user"}</Text>
        <Text style={styles.small}>Demo mode · data stays on this device</Text>
      </Card>
      <Card style={{ marginTop: 13 }}>
        <Text style={styles.h2}>Planning style</Text>
        <Text style={[styles.body, { marginTop: 4, textTransform: "capitalize" }]}>
          {profile.planningStyle.replace("_", " ")}
        </Text>
        <Text style={[styles.h2, { marginTop: 18 }]}>Reminder preference</Text>
        <Text style={[styles.body, { marginTop: 4 }]}>
          {preferenceLabel(profile.reminderTime, reminderTimeOptions)} ·{" "}
          {preferenceLabel(profile.reminderIntensity, reminderIntensityOptions)}
        </Text>
      </Card>
      <View style={{ marginTop: 15, gap: 9 }}>
        <GradientButton
          title="Load demo data"
          icon="play"
          onPress={() => {
            seedDemo();
            router.replace("/home");
          }}
        />
        <OutlineButton
          title="Sign out"
          icon="log-out"
          onPress={async () => {
            const error = await signOut();
            setAuthMessage(error);
          }}
        />
      </View>
      {authMessage && (
        <Text style={[styles.body, { color: C.coral, marginTop: 10 }]}>{authMessage}</Text>
      )}
    </AppShell>
  );
}

export function BlockedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useDeadlineStore((s) => s.tasks.find((t) => t.id === id));
  const updateTask = useDeadlineStore((s) => s.updateTask);
  const addActivity = useDeadlineStore((s) => s.addActivity);
  const [problem, setProblem] = useState("");
  const [plan, setPlan] = useState<string[] | null>(null);
  const analyze = () =>
    setPlan([
      "Take a breath — this is fixable.",
      "Do the smallest possible next step today.",
      "Check whether the document or office has an online alternative.",
      "Set a clear reminder for the earliest next opportunity.",
    ]);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const analyzeLive = async () => {
    if (!task) return;
    setBusy(true);
    setAssistantError(null);
    updateTask(task.id, { status: "blocked", blockerReason: problem });
    addActivity({ taskId: task.id, type: "blocked" });
    try {
      const recovery = await getLiveBlockerRecovery(task.title, problem);
      setPlan([...recovery.steps, `Alternative: ${recovery.alternative}`]);
    } catch (reason) {
      setAssistantError(
        reason instanceof Error ? reason.message : "Live assistant could not respond.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!task)
    return (
      <AppShell>
        <Card>
          <Text style={styles.body}>Task not found.</Text>
        </Card>
      </AppShell>
    );
  return (
    <AppShell>
      <OutlineButton title="Back to plan" icon="arrow-left" onPress={() => router.back()} />
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Dew size={150} />
      </View>
      <Text style={[styles.title, { textAlign: "center" }]}>Let's unblock this.</Text>
      <Text style={[styles.body, { textAlign: "center", marginTop: 8 }]}>
        Tell Dew what stopped you from: {task.title}
      </Text>
      <TextInput
        value={problem}
        onChangeText={setProblem}
        multiline
        placeholder="e.g. Photo studio is closed on Sunday."
        placeholderTextColor={C.sub}
        style={[styles.input, { height: 120, marginTop: 20 }]}
      />
      <View style={{ marginTop: 12 }}>
        <GradientButton
          title="Analyze blocker"
          icon="message-circle"
          onPress={() => void analyzeLive()}
          disabled={!problem.trim() || busy}
        />
      </View>
      {assistantError && (
        <Card style={{ marginTop: 12, backgroundColor: "#FDE9E7" }}>
          <Text style={[styles.body, { color: C.coral }]}>{assistantError}</Text>
          <View style={{ marginTop: 9 }}>
            <OutlineButton title="Use Demo Mode recovery" onPress={analyze} />
          </View>
        </Card>
      )}
      {plan && (
        <Card style={{ marginTop: 15, backgroundColor: "#E7F7EF" }}>
          <Text style={styles.h2}>Recovery plan</Text>
          {plan.map((item, index) => (
            <View key={item} style={[styles.row, { gap: 9, marginTop: 11 }]}>
              <View style={[styles.logo, { width: 24, height: 24, borderRadius: 12 }]}>
                <Text style={[styles.logoText, { fontSize: 12 }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.body, { flex: 1, color: C.text }]}>{item}</Text>
            </View>
          ))}
          <View style={{ marginTop: 16 }}>
            <GradientButton
              title="Apply plan"
              onPress={() => {
                updateTask(task.id, { status: "pending", blockerReason: problem });
                addActivity({ taskId: task.id, type: "blocker_recovered" });
                router.back();
              }}
            />
          </View>
        </Card>
      )}
    </AppShell>
  );
}
