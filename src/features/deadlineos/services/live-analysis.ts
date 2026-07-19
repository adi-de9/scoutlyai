import { File } from "expo-file-system";
import { supabase } from "../../auth/supabase";
import type { Analysis, Notice } from "../store";
import type { NoticeFileSource } from "./notice-source";

type RemoteExtraction = {
  title: string;
  deadline: { date: string | null; time: string | null; timezone: string | null };
  required_documents: { name: string }[];
  instructions: string[];
  unclear_items: string[];
  confidence: number;
};

const makeId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (part) => {
    const value = Math.floor(Math.random() * 16);
    return (part === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
const cleanName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

export const liveAnalysisAvailable = () => Boolean(supabase);

export async function startLiveAnalysis(input: {
  text?: string;
  file?: NoticeFileSource;
}): Promise<{ notice: Notice; jobId: string }> {
  if (!supabase) throw new Error("Live analysis is not configured on this build.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in before using live analysis.");
  if (!input.text?.trim() && !input.file)
    throw new Error("Paste text or choose a screenshot or PDF.");
  const id = makeId();
  const sourceType = input.file?.kind || "text";
  let sourcePath: string | null = null;
  if (input.file) {
    const file = new File(input.file.uri);
    const path = `${auth.user.id}/${id}/${cleanName(input.file.name)}`;
    const { error } = await supabase.storage
      .from("notice-source")
      .upload(path, await file.arrayBuffer(), {
        contentType: input.file.mimeType,
        upsert: false,
      });
    if (error)
      throw new Error("Could not upload the private notice file. Check your connection and retry.");
    sourcePath = path;
  }
  const { error: noticeError } = await supabase.from("notices").insert({
    id,
    user_id: auth.user.id,
    title: input.file?.name || "New notice",
    source_type: sourceType,
    source_name: input.file?.name || "Pasted text",
    source_mime_type: input.file?.mimeType || "text/plain",
    source_size: input.file?.size || input.text?.length || 0,
    source_path: sourcePath,
    raw_text: input.text?.trim() || null,
  });
  if (noticeError) throw new Error("Could not save the notice. Check your connection and retry.");
  const { data: queued, error: queueError } = await supabase.functions.invoke("enqueue-analysis", {
    body: { notice_id: id },
  });
  if (queueError || !queued?.job?.id)
    throw new Error(
      "Could not queue analysis. Your upload is safe; retry from the analysis screen.",
    );
  // Start now for an immediate hackathon demo. The saved queue job still survives a close/restart.
  void supabase.functions.invoke("process-analysis", { body: { job_id: queued.job.id } });
  return {
    jobId: queued.job.id,
    notice: {
      id,
      title: input.file?.name || "New notice",
      rawText: input.text?.trim() || "",
      sourceType: input.file?.kind === "pdf" ? "PDF" : input.file ? "Screenshot" : "Pasted text",
      status: "pending",
      createdAt: new Date().toISOString(),
      liveJobId: queued.job.id,
    },
  };
}

export async function readLiveJob(jobId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("analysis_jobs")
    .select("id,status,progress,error_message,notice_id")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new Error("Could not refresh analysis progress.");
  return data;
}

export async function readLiveAnalysis(noticeId: string): Promise<Analysis | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("analyses")
    .select("title,deadline_at,priority,confidence,extraction")
    .eq("notice_id", noticeId)
    .maybeSingle();
  if (error) throw new Error("Could not load the extracted notice.");
  if (!data) return null;
  const extraction = data.extraction as RemoteExtraction;
  const deadline =
    data.deadline_at ||
    (extraction.deadline.date
      ? `${extraction.deadline.date}T17:00:00`
      : new Date(Date.now() + 6 * 86400000).toISOString());
  return {
    title: data.title,
    source: "Gemini live analysis",
    mainDeadline: deadline,
    priority: data.priority,
    confidence: Number(data.confidence),
    documents: extraction.required_documents.map((item) => item.name),
    instructions: extraction.instructions,
    unclear: extraction.unclear_items,
  };
}

export async function retryLiveAnalysis(jobId: string) {
  if (!supabase) throw new Error("Live analysis is not configured on this build.");
  const { error } = await supabase
    .from("analysis_jobs")
    .update({ status: "queued", progress: 0, error_message: null })
    .eq("id", jobId)
    .eq("status", "failed");
  if (error) throw new Error("Could not retry analysis.");
  const response = await supabase.functions.invoke("process-analysis", {
    body: { job_id: jobId, attempts: 2 },
  });
  if (response.error) throw new Error("Retry could not start. Check your connection.");
}

export async function getLiveBlockerRecovery(taskTitle: string, blocker: string) {
  if (!supabase) throw new Error("Live assistant is not configured on this build.");
  const { data, error } = await supabase.functions.invoke("blocker-assistant", {
    body: { task_title: taskTitle, blocker },
  });
  if (error || !data?.steps || !data?.alternative)
    throw new Error("Could not get live recovery steps.");
  return { steps: data.steps as string[], alternative: data.alternative as string };
}
