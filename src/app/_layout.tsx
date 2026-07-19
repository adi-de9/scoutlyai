import { Stack, router } from "expo-router";
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { View } from "react-native";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { useShareIntent } from "expo-share-intent";
import { useEffect } from "react";
import { useDeadlineStore } from "../features/deadlineos/store";
import * as Notifications from 'expo-notifications';

import "../global.css";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const addNoticeFromFile = useDeadlineStore((state) => state.addNoticeFromFile);

  useEffect(() => {
    if (hasShareIntent && shareIntent.type === "file" && shareIntent.files && shareIntent.files.length > 0) {
      const file = shareIntent.files[0];
      const mimeType = file.mimeType || "application/pdf";
      const fileName = file.fileName || "shared_file";
      const uri = file.path;
      
      if (uri) {
        const noticeId = addNoticeFromFile(uri, mimeType, fileName);
        resetShareIntent();
        // Give the auth provider a moment to resolve if the app was closed
        setTimeout(() => {
           router.push(`/analysis/${noticeId}`);
        }, 500);
      }
    }
  }, [hasShareIntent, shareIntent, resetShareIntent, addNoticeFromFile]);

  if (!fontsLoaded) return <View style={{ flex: 1 }} />;
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();
  if (isLoading) return <View style={{ flex: 1 }} />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="home" />
        <Stack.Screen name="add" />
        <Stack.Screen name="analysis/[id]" />
        <Stack.Screen name="deadline/[id]" />
        <Stack.Screen name="blocked/[id]" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}
