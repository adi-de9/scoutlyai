import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { extractWithGemini } from "../_shared/gemini.ts";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message.slice(0, 500) : "Analysis failed";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let client: ReturnType<typeof createClient> | null = null;
  let jobId: string | null = null;
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    client = createClient(url, serviceKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) return json({ error: "Unauthorized" }, 401);
    const body = await request.json();
    jobId = typeof body.job_id === "string" ? body.job_id : null;
    if (!jobId) return json({ error: "job_id is required" }, 400);
    const { data: claimed } = await client
      .from("analysis_jobs")
      .update({
        status: "reading",
        progress: 20,
        started_at: new Date().toISOString(),
        attempts: body.attempts ?? 1,
        error_code: null,
        error_message: null,
      })
      .eq("id", jobId)
      .eq("user_id", auth.user.id)
      .eq("status", "queued")
      .select("id, notice_id")
      .maybeSingle();
    if (!claimed)
      return json({ accepted: true, message: "Job is already being processed or completed" }, 202);
    const { data: notice, error: noticeError } = await client
      .from("notices")
      .select("id, user_id, source_type, source_mime_type, source_path, raw_text")
      .eq("id", claimed.notice_id)
      .eq("user_id", auth.user.id)
      .single();
    if (noticeError || !notice) throw new Error("Private notice source was not found");
    let bytes: Uint8Array | undefined;
    if (notice.source_path) {
      const { data: file, error: fileError } = await client.storage
        .from("notice-source")
        .download(notice.source_path);
      if (fileError || !file) throw new Error("Private notice source could not be read");
      bytes = new Uint8Array(await file.arrayBuffer());
    }
    await client
      .from("analysis_jobs")
      .update({ status: "extracting", progress: 55 })
      .eq("id", jobId);
    const extraction = await extractWithGemini({
      sourceType: notice.source_type,
      rawText: notice.raw_text,
      bytes,
      mimeType: notice.source_mime_type,
    });
    const clock = /^\d{2}:\d{2}$/.test(extraction.deadline.time || "")
      ? extraction.deadline.time
      : "17:00";
    const deadlineAt = extraction.deadline.date
      ? `${extraction.deadline.date}T${clock}:00${extraction.deadline.timezone === "UTC" ? "Z" : ""}`
      : null;
    await client.from("analysis_jobs").update({ status: "planning", progress: 80 }).eq("id", jobId);
    const priority = extraction.deadline.date ? "high" : "medium";
    const { error: analysisError } = await client.from("analyses").upsert(
      {
        notice_id: notice.id,
        user_id: auth.user.id,
        title: extraction.title,
        deadline_at: deadlineAt,
        priority,
        confidence: extraction.confidence,
        extraction,
      },
      { onConflict: "notice_id" },
    );
    if (analysisError) throw analysisError;
    await client
      .from("notices")
      .update({ title: extraction.title, status: "analyzed" })
      .eq("id", notice.id);
    await client
      .from("analysis_jobs")
      .update({
        status: "awaiting_approval",
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    await client.from("activity_events").insert({
      user_id: auth.user.id,
      event_type: "analyzed",
      metadata: { notice_id: notice.id, job_id: jobId },
    });
    return json({ status: "awaiting_approval", extraction });
  } catch (error) {
    if (client && jobId)
      await client
        .from("analysis_jobs")
        .update({
          status: "failed",
          error_code: "analysis_failed",
          error_message: errorMessage(error),
        })
        .eq("id", jobId);
    console.error("process-analysis failed", errorMessage(error));
    return json({ error: "Analysis failed. Retry or use the demo sample." }, 500);
  }
});
