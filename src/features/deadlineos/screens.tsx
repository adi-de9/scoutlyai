import Feather from "@expo/vector-icons/Feather";
import { format, addDays, startOfMonth, startOfWeek, addMonths, subMonths } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
import { analyzeNotice, daysLeft, riskFor, SAMPLE_NOTICE_TEXT, useDeadlineStore } from "./store";
import { useAuth } from "../auth/AuthProvider";

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
  calCell: { width: "14.285%", minHeight: 51, borderWidth: 0.5, borderColor: C.border, padding: 5 },
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
          <GradientButton title="Get Started" onPress={() => router.push("/onboarding")} />
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
export function OnboardingScreen() {
  const router = useRouter();
  const setProfile = useDeadlineStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const options = step === 1 ? manages : step === 2 ? problems : working;
  const toggle = (value: string) =>
    setSelected((v) => (v.includes(value) ? v.filter((x) => x !== value) : [...v, value]));
  const finish = () => {
    setProfile({
      fullName: name || "there",
      onboardingComplete: true,
      manages: step === 5 ? selected : [],
      problems: [],
      workingStyle: [],
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
              value={name}
              onChangeText={setName}
              placeholder="What should Dew call you?"
              placeholderTextColor={C.sub}
              style={[styles.input, { marginTop: 24, textAlign: "center" }]}
            />
          </>
        )}
        {[1, 2, 5].includes(step) && (
          <>
            <Text style={styles.title}>{titles[step]}</Text>
            <Text style={[styles.body, { marginTop: 7 }]}>Pick everything that applies.</Text>
            <View style={[styles.wrap, { marginTop: 25 }]}>
              {options.map((option) => (
                <Pill
                  key={option}
                  title={option}
                  active={selected.includes(option)}
                  onPress={() => toggle(option)}
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
              {[
                ["minimal", "Minimal plan", "Just the essentials."],
                ["balanced", "Balanced plan", "Steady pacing with review time."],
                ["safe", "Safe plan", "Extra buffer for surprises."],
                ["last_minute", "Last-minute recovery", "Compressed steps close to deadline."],
              ].map(([id, label, body]) => (
                <Pressable
                  key={id}
                  onPress={() => setProfile({ planningStyle: id as any })}
                  style={styles.choice}
                >
                  <Text style={styles.itemTitle}>{label}</Text>
                  <Text style={styles.small}>{body}</Text>
                </Pressable>
              ))}
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
              {["Morning", "Afternoon", "Evening", "Smart timing"].map((v) => (
                <Pill key={v} title={v} onPress={() => setProfile({ reminderTime: v })} />
              ))}
            </View>
            <Text style={[styles.itemTitle, { marginTop: 25, marginBottom: 9 }]}>
              How persistent?
            </Text>
            <View style={styles.wrap}>
              {["Gentle", "Balanced", "Strong accountability"].map((v) => (
                <Pill key={v} title={v} onPress={() => setProfile({ reminderIntensity: v })} />
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
  const addNoticeFromTextAsync = useDeadlineStore((s) => s.addNoticeFromTextAsync);
  const addNoticeFromFile = useDeadlineStore((s) => s.addNoticeFromFile);
  const [source, setSource] = useState("Pasted text");
  const [text, setText] = useState("");
  const submit = () => {
    const noticeId = addNoticeFromTextAsync(text || SAMPLE_NOTICE_TEXT, source);
    router.push(`/analysis/${noticeId}`);
  };

  const handleSourcePress = async (label: string) => {
    if (label === "Voice" || label === "Email") {
      Alert.alert("Coming soon", "Voice/Email importing is not yet supported.");
      return;
    }
    setSource(label);
    if (label === "Pasted text") return;

    try {
      let resultUri = "";
      let resultMime = "";
      let resultName = "";

      if (label === "Photo") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Camera permission is needed.");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled && result.assets && result.assets[0]) {
          resultUri = result.assets[0].uri;
          resultMime = result.assets[0].mimeType || "image/jpeg";
          resultName = result.assets[0].fileName || "photo.jpg";
        } else {
          return;
        }
      } else if (label === "Screenshot") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled && result.assets && result.assets[0]) {
          resultUri = result.assets[0].uri;
          resultMime = result.assets[0].mimeType || "image/png";
          resultName = result.assets[0].fileName || "screenshot.png";
        } else {
          return;
        }
      } else if (label === "PDF") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
        });
        if (!result.canceled && result.assets && result.assets[0]) {
          resultUri = result.assets[0].uri;
          resultMime = result.assets[0].mimeType || "application/pdf";
          resultName = result.assets[0].name;
        } else {
          return;
        }
      }

      if (resultUri) {
        const noticeId = addNoticeFromFile(resultUri, resultMime, resultName);
        router.push(`/analysis/${noticeId}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not pick file");
    }
  };

  return (
    <AppShell>
      <Header title="Add a notice" subtitle="Any notice becomes a clear plan." />
      <View style={{ alignItems: "center" }}>
        <Dew size={130} />
      </View>
      <View style={[styles.wrap, { justifyContent: "center", marginVertical: 15 }]}>
        {[
          ["camera", "Photo"],
          ["file-text", "PDF"],
          ["image", "Screenshot"],
          ["mic", "Voice"],
          ["mail", "Email"],
          ["type", "Pasted text"],
        ].map(([icon, label]) => (
          <Pressable
            key={label}
            onPress={() => handleSourcePress(label)}
            style={[
              styles.choice,
              source === label && styles.choiceOn,
              { width: "30%", alignItems: "center", padding: 11 },
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
        <Text style={styles.itemTitle}>{source}</Text>
        <Text style={[styles.small, { marginTop: 3 }]}>
          For this offline demo, paste a notice or use the supplied example. Device import can be
          connected later.
        </Text>
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          placeholder={SAMPLE_NOTICE_TEXT}
          placeholderTextColor={C.sub}
          style={[styles.input, { height: 170, marginTop: 13 }]}
        />
        <View style={{ marginTop: 13 }}>
          <GradientButton title="Analyze notice" icon="star" onPress={submit} />
        </View>
      </Card>
    </AppShell>
  );
}

export function AnalysisScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = useDeadlineStore((s) => s.notices.find((n) => n.id === id));
  const analysis = useDeadlineStore((s) => s.analyses[id]);
  const generatePlan = useDeadlineStore((s) => s.generatePlan);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (analysis || !notice) return;
    const timer = setInterval(() => {
      setStage((s) => (s < 5 ? s + 1 : s));
    }, 550);
    return () => clearInterval(timer);
  }, [analysis, notice]);
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
          <View style={{ width: "100%", marginTop: 25 }}>
            {[
              "Reading the notice",
              "Detecting dates",
              "Extracting requirements",
              "Identifying documents",
              "Checking unclear information",
              "Creating your execution plan",
            ].map((value, index) => (
              <Card
                key={value}
                style={{ padding: 13, marginTop: 8, opacity: index > stage ? 0.42 : 1 }}
              >
                <View style={styles.row}>
                  <Feather
                    name={index < stage ? "check" : index === stage ? "loader" : "circle"}
                    color={index <= stage ? C.indigo : C.sub}
                    size={17}
                  />
                  <Text style={[styles.itemTitle, { marginLeft: 10 }]}>{value}</Text>
                </View>
              </Card>
            ))}
          </View>
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
      <View style={{ marginVertical: 18 }}>
        <GradientButton
          title="Generate plan"
          icon="arrow-right"
          onPress={() => {
            const deadlineId = generatePlan(id);
            if (deadlineId) router.replace(`/deadline/${deadlineId}`);
          }}
        />
      </View>
    </AppShell>
  );
}

export function DeadlineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines, tasks, updateTask } = useDeadlineStore();
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
              onPress={() =>
                updateTask(task.id, {
                  status: task.status === "done" ? "pending" : "done",
                  completedAt: task.status === "done" ? undefined : new Date().toISOString(),
                })
              }
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
              <Pressable onPress={() => router.push(`/blocked/${task.id}`)}>
                <Feather name="alert-circle" color={C.coral} size={20} />
              </Pressable>
            )}
          </View>
        </Card>
      ))}
    </AppShell>
  );
}

export function TasksScreen() {
  const { tasks, deadlines, updateTask } = useDeadlineStore();
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
                onPress={() =>
                  updateTask(task.id, { status: task.status === "done" ? "pending" : "done" })
                }
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
  const [month, setMonth] = useState(new Date());
  const start = startOfWeek(startOfMonth(month));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <AppShell>
      <Header
        title="Calendar"
        subtitle={format(month, "MMMM yyyy")}
        action={
          <View style={[styles.row, { gap: 8 }]}>
            <Pressable onPress={() => setMonth(subMonths(month, 1))}>
              <Feather name="chevron-left" size={22} color={C.indigo} />
            </Pressable>
            <Pressable onPress={() => setMonth(addMonths(month, 1))}>
              <Feather name="chevron-right" size={22} color={C.indigo} />
            </Pressable>
          </View>
        }
      />
      <View style={[styles.row, { marginBottom: 5 }]}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={`${d}${i}`} style={[styles.small, { width: "14.285%", textAlign: "center" }]}>
            {d}
          </Text>
        ))}
      </View>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {days.map((day) => {
            const active = format(day, "yyyy-MM-dd");
            const items = deadlines.filter(
              (d) => format(new Date(d.deadlineAt), "yyyy-MM-dd") === active,
            );
            return (
              <View
                key={active}
                style={[
                  styles.calCell,
                  format(day, "M") !== format(month, "M") && { opacity: 0.35 },
                ]}
              >
                <Text style={[styles.small, { color: C.text }]}>{format(day, "d")}</Text>
                {items.slice(0, 1).map((item) => (
                  <Pressable key={item.id} onPress={() => router.push(`/deadline/${item.id}`)}>
                    <View
                      style={{ height: 5, borderRadius: 3, backgroundColor: C.coral, marginTop: 5 }}
                    />
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      </Card>
      <Text style={[styles.small, { marginTop: 13 }]}>
        A coral dot marks a deadline. Tap it to open the plan.
      </Text>
    </AppShell>
  );
}

export function InsightsScreen() {
  const tasks = useDeadlineStore((s) => s.tasks);
  const deadlines = useDeadlineStore((s) => s.deadlines);
  const complete = tasks.filter((t) => t.status === "done").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
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
          Keep showing up. Even one finished small step gives your plan energy.
        </Text>
        <View
          style={[
            styles.row,
            { height: 105, alignItems: "flex-end", justifyContent: "space-between", marginTop: 15 },
          ]}
        >
          {[30, 55, 25, 72, 43, 90, 62].map((height, i) => (
            <View
              key={i}
              style={{
                width: 25,
                height,
                borderRadius: 8,
                backgroundColor: i === 6 ? C.indigo : "#DCD4FA",
              }}
            />
          ))}
        </View>
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
  const router = useRouter();
  const { profile, reset, seedDemo } = useDeadlineStore();
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
          {profile.reminderTime} · {profile.reminderIntensity}
        </Text>
      </Card>
      <View style={{ marginTop: 15, gap: 9 }}>
        <OutlineButton
          title="Restart onboarding"
          icon="refresh-cw"
          onPress={() => {
            reset();
            router.replace("/onboarding");
          }}
        />
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
      {authMessage && <Text style={[styles.body, { color: C.coral, marginTop: 10 }]}>{authMessage}</Text>}
    </AppShell>
  );
}

export function BlockedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useDeadlineStore((s) => s.tasks.find((t) => t.id === id));
  const updateTask = useDeadlineStore((s) => s.updateTask);
  const [problem, setProblem] = useState("");
  const [plan, setPlan] = useState<string[] | null>(null);
  const analyze = () =>
    setPlan([
      "Take a breath — this is fixable.",
      "Do the smallest possible next step today.",
      "Check whether the document or office has an online alternative.",
      "Set a clear reminder for the earliest next opportunity.",
    ]);
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
          onPress={analyze}
          disabled={!problem.trim()}
        />
      </View>
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
                router.back();
              }}
            />
          </View>
        </Card>
      )}
    </AppShell>
  );
}
