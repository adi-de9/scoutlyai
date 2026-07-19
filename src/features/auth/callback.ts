import * as Linking from "expo-linking";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase, supabaseConfigurationError } from "./supabase";

export const authCallbackUrl = () => Linking.createURL("auth/callback");

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const callbacksInFlight = new Map<string, Promise<string | null>>();

function callbackParams(url: string) {
  const queryParams = Linking.parse(url).queryParams;
  const fragmentIndex = url.indexOf("#");
  const fragmentParams =
    fragmentIndex < 0
      ? undefined
      : Linking.parse(`${url.slice(0, fragmentIndex)}?${url.slice(fragmentIndex + 1)}`).queryParams;
  return { queryParams, fragmentParams };
}

function callbackValue(
  key: string,
  queryParams: Record<string, string | string[]> | null | undefined,
  fragmentParams: Record<string, string | string[]> | null | undefined,
) {
  return firstValue(queryParams?.[key]) || firstValue(fragmentParams?.[key]);
}

async function returnErrorUnlessSignedIn(error: { message: string } | null) {
  if (!error || !supabase) return error?.message ?? null;
  const { data } = await supabase.auth.getSession();
  return data.session ? null : error.message;
}

async function completeCallbackOnce(url: string): Promise<string | null> {
  if (!supabase) return supabaseConfigurationError;
  const { data: existingSession } = await supabase.auth.getSession();
  if (existingSession.session) return null;

  const { queryParams, fragmentParams } = callbackParams(url);
  const errorDescription = callbackValue("error_description", queryParams, fragmentParams);
  const providerError = callbackValue("error", queryParams, fragmentParams);
  if (errorDescription || providerError)
    return errorDescription || providerError || "Sign-in could not finish.";

  const code = callbackValue("code", queryParams, fragmentParams);
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return returnErrorUnlessSignedIn(error);
  }

  const accessToken = callbackValue("access_token", queryParams, fragmentParams);
  const refreshToken = callbackValue("refresh_token", queryParams, fragmentParams);
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return returnErrorUnlessSignedIn(error);
  }

  const tokenHash = callbackValue("token_hash", queryParams, fragmentParams);
  const type = callbackValue("type", queryParams, fragmentParams);
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    return returnErrorUnlessSignedIn(error);
  }

  return "This sign-in link is incomplete or expired. Return to Deadline OS and sign in again.";
}

export function completeAuthCallback(url: string): Promise<string | null> {
  const inFlight = callbacksInFlight.get(url);
  if (inFlight) return inFlight;

  const completion = completeCallbackOnce(url);
  callbacksInFlight.set(url, completion);
  void completion.finally(() => callbacksInFlight.delete(url));
  return completion;
}
