import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export const MAX_NOTICE_FILE_BYTES = 10 * 1024 * 1024;
export type NoticeFileSource = {
  kind: "image" | "pdf";
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export function validateNoticeFile(source: NoticeFileSource) {
  if (source.size > MAX_NOTICE_FILE_BYTES) throw new Error("This file is larger than 10 MB.");
  if (source.kind === "pdf" && source.mimeType !== "application/pdf")
    throw new Error("Choose a PDF document.");
  if (
    source.kind === "image" &&
    !["image/jpeg", "image/png", "image/webp"].includes(source.mimeType)
  )
    throw new Error("Choose a PNG, JPG, or WebP screenshot.");
  return source;
}

export async function pickNoticeScreenshot(): Promise<NoticeFileSource | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Photo permission is needed to choose a screenshot.");
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return validateNoticeFile({
    kind: "image",
    uri: asset.uri,
    name: asset.fileName || "notice-screenshot.jpg",
    mimeType: asset.mimeType || "image/jpeg",
    size: asset.fileSize || 0,
  });
}

export async function pickNoticePdf(): Promise<NoticeFileSource | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return validateNoticeFile({
    kind: "pdf",
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType || "application/pdf",
    size: asset.size || 0,
  });
}
