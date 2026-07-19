import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { getSharedPayloads } from "expo-sharing";
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useEffect } from "react";
import { View } from "react-native";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";

import "../global.css";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  if (!fontsLoaded) return <View style={{ flex: 1 }} />;
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() =>
      router.push("/tasks"),
    );
    return () => subscription.remove();
  }, [router]);
  useEffect(() => {
    try {
      if (session && getSharedPayloads().length) router.replace("/share");
    } catch {
      // expo-sharing is unavailable on unsupported platforms such as web.
    }
  }, [router, session]);
  if (isLoading) return <View style={{ flex: 1 }} />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="share" />
      <Stack.Screen name="auth/callback" />
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
