import Feather from "@expo/vector-icons/Feather";
import { File } from "expo-file-system";
import { useIncomingShare } from "expo-sharing";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../features/auth/AuthProvider";
import { SAMPLE_NOTICE_TEXT, useDeadlineStore } from "../features/deadlineos/store";
import { startLiveAnalysis } from "../features/deadlineos/services/live-analysis";
import {
  type NoticeFileSource,
  validateNoticeFile,
} from "../features/deadlineos/services/notice-source";
import {
  AppShell,
  C,
  Card,
  Dew,
  GradientButton,
  Header,
  OutlineButton,
} from "../features/deadlineos/ui";

const supportedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

type SharedNoticeSource =
  { kind: "file"; file: NoticeFileSource } | { kind: "text"; text: string; isLink: boolean };

function sharedSourceFromPayload(
  payload?: ReturnType<typeof useIncomingShare>["resolvedSharedPayloads"][number],
): SharedNoticeSource | null {
  if (!payload) return null;
  if (payload.shareType === "text" || payload.shareType === "url") {
    const text = payload.value.trim();
    if (!text) throw new Error("The shared text is empty. Share the notice text and try again.");
    return { kind: "text", text, isLink: payload.shareType === "url" };
  }

  const mimeType = payload.contentMimeType || payload.mimeType || "";
  if (!payload.contentUri || !supportedMimeTypes.has(mimeType)) return null;
  const file = new File(payload.contentUri);
  const source: NoticeFileSource = {
    kind: mimeType === "application/pdf" ? "pdf" : "image",
    uri: payload.contentUri,
    name:
      payload.originalName ||
      file.name ||
      (mimeType === "application/pdf" ? "shared-notice.pdf" : "shared-notice.jpg"),
    mimeType,
    size: payload.contentSize ?? file.size,
  };
  return { kind: "file", file: validateNoticeFile(source) };
}

export default function ShareScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const addNotice = useDeadlineStore((state) => state.addNotice);
  const { resolvedSharedPayloads, isResolving, error, clearSharedPayloads } = useIncomingShare();
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const shared = useMemo(() => {
    try {
      return sharedSourceFromPayload(resolvedSharedPayloads[0]);
    } catch (reason) {
      return reason instanceof Error ? reason : new Error("This shared item cannot be used.");
    }
  }, [resolvedSharedPayloads]);
  const invalidReason =
    resolvedSharedPayloads.length > 1
      ? "Share one notice at a time so Deadline OS can review it safely."
      : shared instanceof Error
        ? shared.message
        : null;
  const source = shared instanceof Error ? null : shared;

  const finishOrAdd = (noticeId: string) => {
    clearSharedPayloads();
    router.replace(`/analysis/${noticeId}`);
  };
  const analyze = async () => {
    if (!source) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const result = await startLiveAnalysis(
        source.kind === "text" ? { text: source.text } : { file: source.file },
      );
      const notice = addNotice(result.notice.rawText, result.notice.sourceType, result.notice);
      finishOrAdd(notice.id);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "Could not start live analysis.");
    } finally {
      setBusy(false);
    }
  };
  const useDemo = () => {
    const notice = addNotice(SAMPLE_NOTICE_TEXT, "Demo mode");
    finishOrAdd(notice.id);
  };
  const cancel = () => {
    clearSharedPayloads();
    router.replace("/add");
  };

  return (
    <AppShell>
      <Header title="Shared notice" subtitle="Review once, then extract the important dates." />
      <View style={{ alignItems: "center", marginBottom: 12 }}>
        <Dew size={112} />
      </View>
      {!session ? (
        <Card>
          <Text style={{ color: C.text, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17 }}>
            Sign in to protect this notice
          </Text>
          <Text style={{ color: C.sub, marginTop: 8, lineHeight: 22 }}>
            Deadline OS keeps shared notices private in your account. After sign-in, this notice
            will return here.
          </Text>
          <View style={{ marginTop: 16 }}>
            <GradientButton
              title="Sign in to continue"
              icon="log-in"
              onPress={() => router.push("/sign-in")}
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <OutlineButton title="Cancel shared notice" icon="x" onPress={cancel} />
          </View>
        </Card>
      ) : isResolving ? (
        <Card style={{ alignItems: "center", gap: 12 }}>
          <ActivityIndicator color={C.indigo} size="large" />
          <Text style={{ color: C.sub }}>Reading the shared notice…</Text>
        </Card>
      ) : source && !invalidReason ? (
        <Card>
          {source.kind === "file" ? (
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Feather
                name={source.file.kind === "pdf" ? "file-text" : "image"}
                color={C.indigo}
                size={30}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: C.text, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16 }}
                  numberOfLines={2}
                >
                  {source.file.name}
                </Text>
                <Text style={{ color: C.sub, marginTop: 4 }}>
                  {source.file.kind === "pdf" ? "PDF" : "Screenshot"} ·{" "}
                  {(source.file.size / 1024 / 1024).toFixed(1)} MB
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Feather name={source.isLink ? "link" : "type"} color={C.indigo} size={25} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: C.text,
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                    }}
                  >
                    {source.isLink ? "Shared link" : "Shared text"}
                  </Text>
                  <Text style={{ color: C.sub, marginTop: 3 }}>
                    {source.text.length.toLocaleString()} characters
                  </Text>
                </View>
              </View>
              <Text numberOfLines={6} style={{ color: C.text, lineHeight: 21, marginTop: 14 }}>
                {source.text}
              </Text>
            </>
          )}
          <Text style={{ color: C.sub, marginTop: 16, lineHeight: 22 }}>
            Deadline OS will privately analyze this notice for deadlines and required documents.
          </Text>
          {submitError && (
            <Text style={{ color: C.coral, marginTop: 12, lineHeight: 21 }}>{submitError}</Text>
          )}
          <View style={{ marginTop: 16 }}>
            <GradientButton
              title={busy ? "Starting analysis…" : "Extract deadlines"}
              icon="star"
              disabled={busy}
              onPress={() => void analyze()}
            />
          </View>
          {submitError && (
            <View style={{ marginTop: 10 }}>
              <OutlineButton title="Use demo sample instead" icon="play" onPress={useDemo} />
            </View>
          )}
          <View style={{ marginTop: 10 }}>
            <OutlineButton title="Cancel" icon="x" onPress={cancel} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={{ color: C.text, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17 }}>
            This shared item cannot be read
          </Text>
          <Text style={{ color: C.sub, marginTop: 8, lineHeight: 22 }}>
            {invalidReason ||
              error?.message ||
              "Share one text notice, PDF, JPG, PNG, or WebP screenshot."}
          </Text>
          <View style={{ marginTop: 16 }}>
            <OutlineButton title="Open Add notice" icon="plus" onPress={cancel} />
          </View>
        </Card>
      )}
    </AppShell>
  );
}
