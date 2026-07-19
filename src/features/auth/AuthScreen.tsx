import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useDeadlineStore } from "../deadlineos/store";
import { Card, C, F, GradientButton, Screen } from "../deadlineos/ui";
import { authCallbackUrl } from "./callback";
import { signInWithGoogle } from "./google";
import { supabase, supabaseConfigurationError } from "./supabase";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen() {
  const router = useRouter();
  const onboardingComplete = useDeadlineStore((state) => state.profile.onboardingComplete);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"error" | "success">("error");

  const showError = (value: string | null) => {
    setMessageKind("error");
    setMessage(value);
  };

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) return showError("Enter a valid email address.");
    if (password.length < 6) return showError("Your password must have at least 6 characters.");
    if (!supabase) return showError(supabaseConfigurationError);

    setIsSubmitting(true);
    setMessage(null);
    const result =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: { emailRedirectTo: authCallbackUrl() },
          });
    setIsSubmitting(false);
    if (result.error) return showError(result.error.message);
    if (result.data.session) {
      router.replace(onboardingComplete ? "/home" : "/onboarding");
      return;
    }
    if (mode === "signUp" && !result.data.session) {
      setMessageKind("success");
      setMessage(
        "Check your email to confirm your account. The link will open Deadline OS and sign you in.",
      );
    }
  };

  const submitGoogle = async () => {
    setIsGoogleSubmitting(true);
    setMessage(null);
    const error = await signInWithGoogle();
    setIsGoogleSubmitting(false);
    if (error) showError(error);
  };

  const resendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail) || !supabase) return;
    setIsSubmitting(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: { emailRedirectTo: authCallbackUrl() },
    });
    setIsSubmitting(false);
    setMessageKind(error ? "error" : "success");
    setMessage(error?.message || "A fresh confirmation email is on its way.");
  };

  const isBusy = isSubmitting || isGoogleSubmitting;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>DEADLINEOS</Text>
        <Text style={styles.title}>
          {mode === "signIn" ? "Welcome back" : "Create your account"}
        </Text>
        <Text style={styles.body}>
          {mode === "signIn"
            ? "Sign in to keep your deadline plan private."
            : "Create an account to start protecting your deadline plan."}
        </Text>
      </View>
      <Card>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          placeholder="you@example.com"
          placeholderTextColor={C.sub}
          style={styles.input}
          editable={!isBusy}
        />
        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          placeholder="At least 6 characters"
          placeholderTextColor={C.sub}
          style={styles.input}
          editable={!isBusy}
        />
        {message && (
          <Text style={[styles.message, messageKind === "success" && styles.messageSuccess]}>
            {message}
          </Text>
        )}
        <View style={{ marginTop: 20 }}>
          {isSubmitting ? (
            <View style={styles.loading}>
              <ActivityIndicator color={C.indigo} />
            </View>
          ) : (
            <GradientButton
              title={mode === "signIn" ? "Sign in" : "Create account"}
              icon={mode === "signIn" ? "log-in" : "user-plus"}
              onPress={submit}
            />
          )}
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <Pressable
          disabled={isBusy}
          onPress={submitGoogle}
          style={[styles.googleButton, isBusy && styles.disabledButton]}
        >
          {isGoogleSubmitting ? (
            <ActivityIndicator color={C.text} />
          ) : (
            <>
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        <Pressable
          disabled={isBusy}
          onPress={() => {
            setMode((current) => (current === "signIn" ? "signUp" : "signIn"));
            setMessage(null);
            setMessageKind("error");
          }}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {mode === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
        {mode === "signUp" && messageKind === "success" && (
          <Pressable
            disabled={isBusy}
            onPress={() => void resendConfirmation()}
            style={styles.resendButton}
          >
            <Text style={styles.switchText}>Resend confirmation email</Text>
          </Pressable>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 28, marginBottom: 24 },
  eyebrow: { color: C.indigo, fontFamily: F.bold, fontSize: 12, letterSpacing: 1.4 },
  title: { color: C.text, fontFamily: F.displayBold, fontSize: 32, marginTop: 8 },
  body: { color: C.sub, fontFamily: F.sans, fontSize: 15, lineHeight: 22, marginTop: 8 },
  label: { color: C.text, fontFamily: F.medium, fontSize: 14, marginBottom: 7 },
  input: {
    borderColor: C.border,
    borderRadius: 14,
    borderWidth: 1,
    color: C.text,
    fontFamily: F.sans,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  message: { color: C.coral, fontFamily: F.sans, fontSize: 13, lineHeight: 19, marginTop: 14 },
  messageSuccess: { color: "#18794E" },
  loading: { alignItems: "center", minHeight: 49, justifyContent: "center" },
  divider: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 18 },
  dividerLine: { backgroundColor: C.border, flex: 1, height: 1 },
  dividerText: { color: C.sub, fontFamily: F.sans, fontSize: 12 },
  googleButton: {
    alignItems: "center",
    borderColor: C.border,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 49,
  },
  disabledButton: { opacity: 0.45 },
  googleMark: { color: "#4285F4", fontFamily: F.bold, fontSize: 20 },
  googleText: { color: C.text, fontFamily: F.medium, fontSize: 14 },
  switchButton: { alignItems: "center", marginTop: 18, padding: 8 },
  switchText: { color: C.indigo, fontFamily: F.medium, fontSize: 14 },
  resendButton: { alignItems: "center", marginTop: 4, padding: 8 },
});
