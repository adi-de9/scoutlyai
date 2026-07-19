import { getSharedPayloads } from "expo-sharing";

const SUPPORTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const payloads = getSharedPayloads();
    const hasSupportedNotice = payloads.some(
      (payload) =>
        ((payload.shareType === "image" || payload.shareType === "file") &&
          SUPPORTED_MIME_TYPES.has(payload.mimeType || "")) ||
        payload.shareType === "text" ||
        payload.shareType === "url",
    );
    return hasSupportedNotice ? "/share" : path;
  } catch {
    return path;
  }
}
