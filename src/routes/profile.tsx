import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Dew } from "@/components/mascot/Dew";
import { useDemoStore } from "@/lib/demo-store";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — DeadlineOS" }] }),
});

function ProfilePage() {
  const navigate = useNavigate();
  const profile = useDemoStore((s) => s.profile);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const setProfile = useDemoStore((s) => s.setProfile);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
      <div className="mt-6 flex items-center gap-4 rounded-3xl border border-border bg-surface p-6 shadow-card">
        <Dew state="waving" size={80} />
        <div>
          <div className="font-display text-xl font-semibold">{profile.fullName || "Guest"}</div>
          <div className="text-sm text-muted-foreground">{profile.manages.join(", ") || "Not set"}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Reminder time" value={profile.reminderTime} />
        <Field label="Planning style" value={profile.planningStyle} />
        <Field label="Reminder intensity" value={profile.reminderIntensity} />
        <Field label="Onboarded" value={profile.onboardingComplete ? "Yes" : "No"} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => navigate({ to: "/onboarding" })}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm hover:bg-accent"
        >
          Re-run onboarding
        </button>
        <button
          onClick={() => {
            resetDemo();
            setProfile({ onboardingComplete: false });
            toast.success("Demo reset.");
            navigate({ to: "/" });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-coral/40 bg-coral/10 px-4 py-2 text-sm text-[oklch(0.4_0.15_30)] hover:bg-coral/20"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Reset demo data
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium capitalize">{value || "—"}</div>
    </div>
  );
}
