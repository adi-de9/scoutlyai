import { z } from "npm:zod@3.25.76";

export const noticeExtractionSchema = z.object({
  title: z.string().min(1).max(160),
  source_type: z.enum(["text", "image", "pdf"]),
  deadline: z.object({
    date: z.string().nullable(),
    time: z.string().nullable(),
    timezone: z.string().nullable(),
    evidence: z.string().min(1).max(500),
  }),
  required_documents: z
    .array(z.object({ name: z.string().min(1), evidence: z.string().min(1) }))
    .max(30),
  instructions: z.array(z.string().min(1)).max(30),
  unclear_items: z.array(z.string().min(1)).max(20),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).max(20),
});

export type NoticeExtraction = z.infer<typeof noticeExtractionSchema>;

const responseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    source_type: { type: "STRING", enum: ["text", "image", "pdf"] },
    deadline: {
      type: "OBJECT",
      properties: {
        date: { type: "STRING", nullable: true },
        time: { type: "STRING", nullable: true },
        timezone: { type: "STRING", nullable: true },
        evidence: { type: "STRING" },
      },
      required: ["date", "time", "timezone", "evidence"],
    },
    required_documents: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { name: { type: "STRING" }, evidence: { type: "STRING" } },
        required: ["name", "evidence"],
      },
    },
    instructions: { type: "ARRAY", items: { type: "STRING" } },
    unclear_items: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "NUMBER" },
    warnings: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "title",
    "source_type",
    "deadline",
    "required_documents",
    "instructions",
    "unclear_items",
    "confidence",
    "warnings",
  ],
};

const prompt = `Extract only information present in this notice. Return JSON matching the supplied schema. Use ISO date YYYY-MM-DD when a deadline date is explicit and 24-hour HH:mm when a deadline time is explicit; otherwise use null. Never invent a deadline, document, location, or instruction. Put uncertainty in unclear_items and warnings. Evidence must be a short quote or precise description of the source.`;

function toBase64(bytes: Uint8Array) {
  let result = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(result);
}

export async function extractWithGemini(input: {
  sourceType: "text" | "image" | "pdf";
  rawText?: string | null;
  bytes?: Uint8Array;
  mimeType?: string | null;
}): Promise<NoticeExtraction> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const call = async (model: string) => {
    const parts: Record<string, unknown>[] = [{ text: prompt }];
    if (input.rawText) parts.push({ text: `NOTICE TEXT:\n${input.rawText}` });
    if (input.bytes && input.mimeType)
      parts.push({ inline_data: { mime_type: input.mimeType, data: toBase64(input.bytes) } });
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema,
            temperature: 0,
          },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no structured extraction");
    return noticeExtractionSchema.parse(JSON.parse(text));
  };
  try {
    const extraction = await call("gemini-2.5-flash-lite");
    if (extraction.confidence >= 0.55) return extraction;
  } catch {
    // A single stronger retry below handles a failed or invalid lightweight response.
  }
  return call("gemini-2.5-flash");
}
