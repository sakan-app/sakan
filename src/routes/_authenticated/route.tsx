import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { resolveGuardUser } from "@/lib/auth/offline-session";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async () => {
    // Offline-tolerant: a missing network must not look like a signed-out user.
    const user = await resolveGuardUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: AppShell,
  errorComponent: RouteErrorBoundary,
});