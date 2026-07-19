import * as Linking from "expo-linking";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase, supabaseConfigurationError } from "./supabase";

export const authCallbackUrl = () => Linking.createURL("auth/callback");

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export async function completeAuthCallback(url: string): Promise<string | null> {
  if (!supabase) return supabaseConfigurationError;
  const { queryParams } = Linking.parse(url);
  const errorDescription = firstValue(queryParams?.error_description);
  const providerError = firstValue(queryParams?.error);
  if (errorDescription || providerError)
    return errorDescription || providerError || "Sign-in could not finish.";

  const code = firstValue(queryParams?.code);
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    return error?.message ?? null;
  }

  const tokenHash = firstValue(queryParams?.token_hash);
  const type = firstValue(queryParams?.type);
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    return error?.message ?? null;
  }

  return "This sign-in link is incomplete or expired. Return to Deadline OS and sign in again.";
}
