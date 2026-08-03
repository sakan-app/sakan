import { createFileRoute, redirect } from "@tanstack/react-router";

import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "SAKAN Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  errorComponent: RouteErrorBoundary,
});
