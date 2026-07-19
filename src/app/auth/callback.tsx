import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { completeAuthCallback } from "../../features/auth/callback";
import { useAuth } from "../../features/auth/AuthProvider";
import { useDeadlineStore } from "../../features/deadlineos/store";
import { C, F, Screen } from "../../features/deadlineos/ui";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isLoading, session } = useAuth();
  const onboardingComplete = useDeadlineStore((state) => state.profile.onboardingComplete);
  const url = Linking.useLinkingURL();
  const [message, setMessage] = useState("Finishing your sign-in...");

  useEffect(() => {
    if (isLoading) return;

    const destination = onboardingComplete ? "/home" : "/onboarding";

    // A user who has already signed in does not need a token from an old
    // confirmation URL. This also covers email sign-up when Confirm Email is off.
    if (session) {
      router.replace(destination);
      return;
    }

    if (!url) {
      setMessage("Waiting for a sign-in link...");
      return;
    }

    let active = true;
    void completeAuthCallback(url).then((error) => {
      if (!active) return;
      if (error) {
        setMessage(error);
        return;
      }
      setMessage("You are signed in. Opening Deadline OS...");
      router.replace(destination);
    });
    return () => {
      active = false;
    };
  }, [isLoading, onboardingComplete, router, session, url]);

  return (
    <Screen>
      <View
        style={{ alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 28 }}
      >
        <ActivityIndicator color={C.indigo} size="large" />
        <Text
          style={{
            color: C.text,
            fontFamily: F.displayBold,
            fontSize: 25,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Deadline OS
        </Text>
        <Text
          style={{
            color: C.sub,
            fontFamily: F.sans,
            lineHeight: 22,
            marginTop: 9,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </View>
    </Screen>
  );
}
