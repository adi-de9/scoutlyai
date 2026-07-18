import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high"]);
export const riskSchema = z.enum(["low", "medium", "high"]);
export const taskStatusSchema = z.enum(["pending", "in_progress", "done", "blocked", "skipped"]);
export const deadlineStatusSchema = z.enum(["active", "completed", "overdue", "archived"]);
export const planningStyleSchema = z.enum(["minimal", "balanced", "safe", "last_minute"]);
export const reminderIntensitySchema = z.enum(["gentle", "balanced", "strong"]);
export const reminderTimeSchema = z.enum(["morning", "afternoon", "evening", "smart"]);
export const sourceTypeSchema = z.enum(["screenshot", "pdf", "camera", "text", "voice", "email"]);

export const noticeAnalysisSchema = z.object({
  title: z.string(),
  source: z.string(),
  mainDeadline: z.string(), // ISO
  secondaryDates: z.array(z.object({ label: z.string(), date: z.string() })).default([]),
  priority: prioritySchema,
  fee: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  contact: z.string().nullable().default(null),
  eligibility: z.array(z.string()).default([]),
  requiredDocuments: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  unclearInformation: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
});
export type NoticeAnalysis = z.infer<typeof noticeAnalysisSchema>;

export const taskSchema = z.object({
  id: z.string(),
  deadlineId: z.string(),
  title: z.string(),
  description: z.string(),
  scheduledAt: z.string(), // ISO
  estimatedMinutes: z.number(),
  priority: prioritySchema,
  status: taskStatusSchema,
  requiredDocument: z.string().nullable().default(null),
  blockerReason: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  orderIndex: z.number(),
  reminderEnabled: z.boolean().default(true),
});
export type Task = z.infer<typeof taskSchema>;

export const deadlineSchema = z.object({
  id: z.string(),
  noticeId: z.string(),
  title: z.string(),
  description: z.string(),
  deadlineAt: z.string(),
  priority: prioritySchema,
  progress: z.number().min(0).max(100),
  status: deadlineStatusSchema,
  createdAt: z.string(),
});
export type Deadline = z.infer<typeof deadlineSchema>;

export const noticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: sourceTypeSchema,
  rawText: z.string(),
  fileUrl: z.string().nullable().default(null),
  status: z.enum(["pending", "analyzed", "planned", "failed"]).default("pending"),
  createdAt: z.string(),
});
export type Notice = z.infer<typeof noticeSchema>;

export const reminderSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  scheduledAt: z.string(),
  status: z.enum(["pending", "sent", "answered", "snoozed", "dismissed"]),
  response: z.enum(["done", "later", "blocked"]).nullable().default(null),
  snoozedUntil: z.string().nullable().default(null),
  sentAt: z.string().nullable().default(null),
});
export type Reminder = z.infer<typeof reminderSchema>;

export const activityLogSchema = z.object({
  id: z.string(),
  deadlineId: z.string().nullable(),
  taskId: z.string().nullable(),
  action: z.string(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.string(),
});
export type ActivityLog = z.infer<typeof activityLogSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  deadlineId: z.string().nullable(),
  role: z.enum(["user", "assistant"]),
  message: z.string(),
  createdAt: z.string(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const profileSchema = z.object({
  fullName: z.string(),
  avatarUrl: z.string().nullable().default(null),
  manages: z.array(z.string()).default([]),
  problems: z.array(z.string()).default([]),
  planningStyle: planningStyleSchema.default("balanced"),
  reminderTime: reminderTimeSchema.default("smart"),
  reminderIntensity: reminderIntensitySchema.default("balanced"),
  workingStyle: z.array(z.string()).default([]),
  onboardingComplete: z.boolean().default(false),
});
export type Profile = z.infer<typeof profileSchema>;
