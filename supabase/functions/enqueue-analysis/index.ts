import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

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
      .select("id")
      .eq("id", notice_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!notice) return json({ error: "Notice not found" }, 404);
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
