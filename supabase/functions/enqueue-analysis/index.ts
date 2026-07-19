import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;
const ACTIVE_JOB_STATUSES = ["queued", "reading", "extracting", "planning"];
const ALLOWED_FILE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, serviceKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) return json({ error: "Unauthorized" }, 401);
    const { notice_id } = await request.json();
    if (typeof notice_id !== "string") return json({ error: "notice_id is required" }, 400);
    const { data: notice } = await client
      .from("notices")
      .select("id, source_type, source_mime_type, source_size, source_path, raw_text")
      .eq("id", notice_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!notice) return json({ error: "Notice not found" }, 404);
    if (notice.source_size < 0 || notice.source_size > MAX_FILE_BYTES)
      return json({ error: "Notice source is too large" }, 400);
    if (
      notice.source_type === "text" &&
      (!notice.raw_text?.trim() || notice.raw_text.length > MAX_TEXT_CHARS)
    )
      return json({ error: "Pasted text must be between 1 and 50,000 characters" }, 400);
    if (notice.source_type !== "text" && !notice.source_path)
      return json({ error: "Private notice file is missing" }, 400);
    if (
      notice.source_type !== "text" &&
      !ALLOWED_FILE_MIME_TYPES.includes(notice.source_mime_type || "")
    )
      return json({ error: "Notice file type is not supported" }, 400);
    const { count: activeJobs, error: countError } = await client
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .in("status", ACTIVE_JOB_STATUSES);
    if (countError) throw countError;
    if ((activeJobs || 0) >= 3)
      return json({ error: "Wait for one of your current analyses to finish" }, 429);
    const { data: job, error } = await client
      .from("analysis_jobs")
      .insert({ notice_id, user_id: auth.user.id, status: "queued", progress: 0 })
      .select("id, status, progress, created_at")
      .single();
    if (error) throw error;
    // The PGMQ message survives a client close; a scheduled worker can recover any queued job.
    const { error: queueError } = await client.rpc("enqueue_analysis_job", { job_id: job.id });
    if (queueError) throw queueError;
    return json({ job });
  } catch (error) {
    console.error(
      "enqueue-analysis failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return json({ error: "Could not queue analysis" }, 500);
  }
});
