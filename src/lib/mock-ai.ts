import type { NoticeAnalysis, Task } from "@/lib/schemas";
import { uid } from "@/lib/id";

export type PlanningStyle = "minimal" | "balanced" | "safe" | "last_minute";

export const SAMPLE_NOTICE_TEXT =
  "All students must submit the internship application before 20 July 2026. Required documents include Aadhaar card, previous semester marksheet, passport-size photograph, and NOC from college. Late applications will not be accepted.";

// Deterministic mock analyzer based on keyword sniffing so the demo works reliably.
export function mockAnalyze(rawText: string, sourceLabel: string): NoticeAnalysis {
  const text = rawText || SAMPLE_NOTICE_TEXT;
  const t = text.toLowerCase();

  const isInternship = /internship/.test(t);
  const isScholarship = /scholarship/.test(t);
  const isExam = /exam|test/.test(t);
  const isHackathon = /hackathon/.test(t);

  // Try to detect a date; default to 20 July 2026 (spec sample) or +14 days
  const dateMatch = text.match(/(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i);
  let mainDeadline: string;
  if (dateMatch) {
    const day = parseInt(dateMatch[1]!, 10);
    const monthIdx = [
      "january","february","march","april","may","june","july","august","september","october","november","december"
    ].indexOf(dateMatch[2]!.toLowerCase());
    const year = parseInt(dateMatch[3]!, 10);
    mainDeadline = new Date(Date.UTC(year, monthIdx, day, 17, 0, 0)).toISOString();
    // if the parsed date is in the past, shift forward 14 days from now (demo reliability)
    if (new Date(mainDeadline).getTime() < Date.now()) {
      mainDeadline = new Date(Date.now() + 6 * 86400000).toISOString();
    }
  } else {
    mainDeadline = new Date(Date.now() + 6 * 86400000).toISOString();
  }

  const documents: string[] = [];
  if (/aadhaar|aadhar/.test(t)) documents.push("Aadhaar card");
  if (/marksheet|transcript|mark sheet/.test(t)) documents.push("Previous semester marksheet");
  if (/passport.*photo|photograph/.test(t)) documents.push("Passport-size photograph");
  if (/noc/.test(t)) documents.push("NOC from college");
  if (/resume|cv/.test(t)) documents.push("Resume / CV");
  if (/id proof|identity/.test(t)) documents.push("Government ID proof");
  if (documents.length === 0) documents.push("Aadhaar card", "Previous semester marksheet", "Passport-size photograph", "NOC from college");

  const instructions: string[] = [];
  if (/late/.test(t)) instructions.push("Late applications will not be accepted");
  if (/submit/.test(t)) instructions.push("Complete submission before the deadline");
  instructions.push("Keep original copies ready for verification");

  const title = isInternship
    ? "Internship Application"
    : isScholarship
    ? "Scholarship Application"
    : isHackathon
    ? "Hackathon Registration"
    : isExam
    ? "Exam Registration"
    : "New Application";

  return {
    title,
    source: sourceLabel,
    mainDeadline,
    secondaryDates: [
      { label: "Documents ready by", date: new Date(new Date(mainDeadline).getTime() - 3 * 86400000).toISOString() },
      { label: "Draft review", date: new Date(new Date(mainDeadline).getTime() - 1 * 86400000).toISOString() },
    ],
    priority: "high",
    fee: null,
    location: null,
    contact: null,
    eligibility: isInternship ? ["Currently enrolled student", "Minimum 6 CGPA"] : [],
    requiredDocuments: documents,
    instructions,
    unclearInformation: ["Submission location was not visible in the notice."],
    confidence: 0.86,
  };
}

// Generate a task plan for a given analysis + planning style.
export function mockGeneratePlan(
  analysis: NoticeAnalysis,
  deadlineId: string,
  style: PlanningStyle,
): Task[] {
  const end = new Date(analysis.mainDeadline).getTime();
  const now = Date.now();
  const daysAvailable = Math.max(1, Math.ceil((end - now) / 86400000));

  // Build steps based on documents + review + submission
  const docSteps: Array<{ title: string; description: string; est: number; doc?: string }> = analysis.requiredDocuments.map((d) => ({
    title: `Get ${d.toLowerCase()}`,
    description: `Collect ${d} and keep both a physical and scanned copy.`,
    est: 45,
    doc: d,
  }));

  const finalSteps: Array<{ title: string; description: string; est: number; doc?: string }> = [
    { title: "Fill the application", description: "Complete all sections and double-check personal details.", est: 60 },
    { title: "Review everything", description: "Cross-check documents, dates, and signatures before submitting.", est: 30 },
    { title: "Submit before deadline", description: `Submit before ${new Date(analysis.mainDeadline).toLocaleString()}.`, est: 30 },
  ];



  const rawSteps = [...docSteps, ...finalSteps];

  // Buffer strategy per style
  const bufferDays =
    style === "safe" ? 2 : style === "balanced" ? 1 : style === "last_minute" ? 0 : 0;
  const usableDays = Math.max(1, daysAvailable - bufferDays);

  // Distribute steps across usable days, one per day starting from today (or last-minute compressed)
  const startOffset =
    style === "last_minute"
      ? Math.max(0, daysAvailable - rawSteps.length)
      : style === "minimal"
      ? Math.max(0, Math.floor((usableDays - rawSteps.length) / 2))
      : 0;

  const spread = Math.max(1, Math.floor(usableDays / rawSteps.length));

  const tasks: Task[] = rawSteps.map((step, i) => {
    const dayOffset = Math.min(daysAvailable - 1, startOffset + i * spread);
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + dayOffset);
    scheduled.setHours(style === "last_minute" ? 20 : 10, 0, 0, 0);

    return {
      id: uid("task"),
      deadlineId,
      title: step.title,
      description: step.description,
      scheduledAt: scheduled.toISOString(),
      estimatedMinutes: step.est,
      priority: i === rawSteps.length - 1 ? "high" : "medium",
      status: "pending",
      requiredDocument: step.doc ?? null,
      blockerReason: null,
      completedAt: null,
      orderIndex: i,
      reminderEnabled: true,
    };
  });

  return tasks;
}

export function mockBlockerSuggestions(taskTitle: string, reason: string): string[] {
  const t = taskTitle.toLowerCase();
  if (reason === "cannot_find") {
    if (/marksheet/.test(t)) {
      return [
        "Check your college student portal — marksheets are usually downloadable there.",
        "Search your email for attachments from your college with 'marksheet' or 'result'.",
        "Visit the college office during working hours to request a duplicate.",
        "Message your class coordinator — they often have soft copies on file.",
      ];
    }
    if (/aadhaar/.test(t)) {
      return [
        "Download an e-Aadhaar from uidai.gov.in using your registered mobile.",
        "Check your DigiLocker account — Aadhaar is stored there by default.",
        "Search your email or WhatsApp attachments for previous submissions.",
      ];
    }
    if (/passport/.test(t) || /photo/.test(t)) {
      return [
        "Any nearby photo studio can produce passport-size prints in 15 minutes.",
        "You can also take one at home against a plain white wall and crop it to 35×45 mm.",
        "Keep both a print copy and a digital scan ready.",
      ];
    }
    return [
      "Check your email attachments and Google Drive — most documents are already there.",
      "Ask a friend or classmate if they have a sample or template.",
      "Contact the office responsible for issuing this document.",
    ];
  }
  if (reason === "office_closed") {
    return [
      "Note the office's opening hours and schedule a visit for the earliest slot.",
      "Check if the document can be requested online or by email instead.",
      "Add a buffer of 1 day to your plan for the office visit.",
    ];
  }
  if (reason === "need_help") {
    return [
      "Message your class coordinator or a senior who has done this before.",
      "Post the question in your class group — someone likely has it solved.",
      "Ask a family member for help gathering physical documents.",
    ];
  }
  if (reason === "no_understanding") {
    return [
      "Re-read the original notice — highlight the exact ask.",
      "Ask AI (Dew) to break the instruction into simple steps.",
      "Compare with a friend who has already done a similar submission.",
    ];
  }
  if (reason === "no_money") {
    return [
      "Check if the fee can be paid in instalments or waived for students.",
      "Look for a fee-reimbursement or scholarship route.",
      "Ask family for a short-term loan and repay after submission.",
    ];
  }
  if (reason === "busy") {
    return [
      "Break the task into 10-minute chunks you can do between other work.",
      "Reschedule to your least-busy day and set a strong reminder.",
      "Delegate anything you can (photo, printouts) to save time.",
    ];
  }
  return [
    "Describe your blocker more specifically so we can suggest better steps.",
    "Ask Dew for a tailored plan given your situation.",
  ];
}

export const BLOCKER_REASONS: Array<{ id: string; label: string }> = [
  { id: "cannot_find", label: "I cannot find the document" },
  { id: "office_closed", label: "Office is closed" },
  { id: "need_help", label: "I need help from someone" },
  { id: "no_understanding", label: "I do not understand the task" },
  { id: "no_money", label: "I do not have enough money" },
  { id: "busy", label: "I am busy" },
  { id: "other", label: "Other reason" },
];

export function mockBlockerRecovery(
  problem: string,
  currentDeadline?: string,
): { reassurance: string; steps: string[]; newDeadline: string | null } {
  const t = problem.toLowerCase();
  let steps: string[] = [];
  let reassurance = "Take a breath — this is fixable. Here's a way forward.";
  if (/closed|sunday|holiday/.test(t)) {
    steps = [
      "Note the office's next opening time.",
      "Prepare everything you need tonight so the visit takes 15 minutes.",
      "Set a reminder for the exact opening slot.",
      "In parallel, check if the same document is available online.",
    ];
    reassurance = "Closures are common — we'll just shift by a day and stay on track.";
  } else if (/photo|studio/.test(t)) {
    steps = [
      "Search Google Maps for 'photo studio open now' near you.",
      "Alternatively, take a photo at home against a plain white wall.",
      "Crop the photo to passport size (35×45mm) using any online tool.",
      "Keep both print and digital copies.",
    ];
  } else if (/document|missing|lost/.test(t)) {
    steps = [
      "Check your email attachments and DigiLocker first.",
      "Message your class coordinator — they usually have soft copies.",
      "If not available, request a duplicate at the college office.",
      "Add a 1-day buffer for the duplicate to arrive.",
    ];
  } else if (/sign|signature/.test(t)) {
    steps = [
      "Send a polite reminder with a clear 'need by' date.",
      "Offer to visit in person to speed things up.",
      "Prepare a printed copy ready to sign, to remove friction.",
    ];
  } else if (/overwhelm|stress|tired/.test(t)) {
    steps = [
      "Do only the smallest next step today — nothing more.",
      "Dew will re-plan the rest and give you a lighter tomorrow.",
      "Come back to the plan after a short break.",
    ];
    reassurance = "It's okay. Progress > perfection. One step at a time.";
  } else {
    steps = [
      "Describe the blocker in one specific sentence.",
      "Break the next step into something under 15 minutes.",
      "Do that step now. We'll adjust the plan around it.",
    ];
  }
  const newDeadline =
    currentDeadline && /closed|sunday|holiday|missing|lost/.test(t)
      ? new Date(new Date(currentDeadline).getTime() + 86400000).toISOString()
      : null;
  return { reassurance, steps, newDeadline };
}
