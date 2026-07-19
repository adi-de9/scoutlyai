import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";
import { corsHeaders, json } from "../_shared/cors.ts";

const recoverySchema = z.object({
  steps: z.array(z.string().min(1)).length(3),
  alternative: z.string().min(1),
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Unauthorized" }, 401);
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authorization } } },
    );
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return json({ error: "Unauthorized" }, 401);
    const { task_title, blocker } = await request.json();
    if (typeof task_title !== "string" || typeof blocker !== "string" || !blocker.trim())
      return json({ error: "Task and blocker are required" }, 400);
    if (task_title.length > 200 || blocker.length > 2_000)
      return json({ error: "Task title or blocker explanation is too long" }, 400);
    const { data: allowed, error: quotaError } = await client.rpc("consume_ai_quota", {
      p_user_id: auth.user.id,
      p_request_kind: "blocker",
      p_max_requests: 15,
      p_window_seconds: 600,
    });
    if (quotaError) throw quotaError;
    if (!allowed)
      return json({ error: "Assistant limit reached. Try again in a few minutes." }, 429);
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ error: "Live assistant is not configured" }, 503);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Give exactly three practical recovery steps and one alternative for this task. Do not claim to contact anyone or perform the task. Task: ${task_title}\nBlocker: ${blocker}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "OBJECT",
              properties: {
                steps: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
                alternative: { type: "STRING" },
              },
              required: ["steps", "alternative"],
            },
            temperature: 0.2,
          },
        }),
      },
    );
    if (!response.ok) throw new Error("Gemini blocker response failed");
    const payload = await response.json();
    const output = recoverySchema.parse(
      JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text || "{}"),
    );
    return json(output);
  } catch (error) {
    console.error("blocker-assistant failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Could not get live recovery steps" }, 500);
  }
});
