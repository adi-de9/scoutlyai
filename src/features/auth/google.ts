import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase, supabaseConfigurationError } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<string | null> {
  if (!supabase) return supabaseConfigurationError;

  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return error.message;
  if (!data.url) return "Google did not return a sign-in URL. Please try again.";

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    return result.type === "cancel" ? "Google sign-in was cancelled." : "Google sign-in did not finish.";
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
  return sessionError?.message ?? null;
}
