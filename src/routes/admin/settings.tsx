import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  ErrorState,
  LoadingState,
  Panel,
} from "@/components/admin/ui";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/admin/ops.functions";
import { useAdminAccess } from "@/routes/admin/route";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

type Draft = {
  support_email: string;
  maintenance_mode: boolean;
  default_language: "ar" | "en" | "de" | "ru";
  registration_enabled: boolean;
  verification_required: boolean;
  max_gallery_photos: number;
  max_image_mb: number;
  allowed_image_types: string;
};

function AdminSettings() {
  const getFn = useServerFn(getPlatformSettings);
  const updateFn = useServerFn(updatePlatformSettings);
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const [, confirm, , confirmNode] = useConfirm();
  const [draft, setDraft] = useState<Draft | null>(null);

  const settings = useQuery({ queryKey: ["admin", "platform-settings"], queryFn: () => getFn({}) });

  useEffect(() => {
    if (!settings.data) return;
    const s = settings.data;
    setDraft({
      support_email: s.support_email ?? "",
      maintenance_mode: Boolean(s.maintenance_mode),
      default_language: (s.default_language ?? "ar") as Draft["default_language"],
      registration_enabled: s.registration_enabled !== false,
      verification_required: Boolean(s.verification_required),
      max_gallery_photos: s.max_gallery_photos ?? 9,
      max_image_mb: s.max_image_mb ?? 5,
      allowed_image_types: (s.allowed_image_types ?? ["image/jpeg", "image/png", "image/webp"]).join(", "),
    });
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          support_email: draft!.support_email,
          maintenance_mode: draft!.maintenance_mode,
          default_language: draft!.default_language,
          registration_enabled: draft!.registration_enabled,
          verification_required: draft!.verification_required,
          max_gallery_photos: Number(draft!.max_gallery_photos),
          max_image_mb: Number(draft!.max_image_mb),
          allowed_image_types: draft!.allowed_image_types
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save settings"),
  });

  const isSuper = Boolean(access.data?.isSuperAdmin);

  if (settings.isLoading || !draft) return <LoadingState />;
  if (settings.isError) return <ErrorState message="Could not load settings." onRetry={() => void settings.refetch()} />;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="space-y-5">
      {confirmNode}
      <AdminPageHeader
        title="Platform settings"
        subtitle={isSuper ? "Global configuration. Changes apply immediately." : "Read-only — super admin access required to edit."}
        actions={
          isSuper ? (
            <ActionButton
              tone="gold"
              disabled={save.isPending}
              onClick={() =>
                confirm({
                  title: "Apply platform settings?",
                  description: draft.maintenance_mode
                    ? "Maintenance mode is ON — members will be locked out of the app."
                    : "These settings affect every member immediately.",
                  destructive: draft.maintenance_mode,
                  confirmLabel: "Apply settings",
                  onConfirm: () => save.mutateAsync(),
                })
              }
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </ActionButton>
          ) : null
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="space-y-4">
          <h2 className="text-sm font-semibold text-cream">General</h2>
          <Row label="Support email">
            <AdminInput
              value={draft.support_email}
              disabled={!isSuper}
              onChange={(event) => set("support_email", event.target.value)}
              placeholder="support@sakanapp.net"
            />
          </Row>
          <Row label="Default language">
            <AdminSelect
              value={draft.default_language}
              disabled={!isSuper}
              onChange={(event) => set("default_language", event.target.value as Draft["default_language"])}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
            </AdminSelect>
          </Row>
          <Toggle
            label="Registration enabled"
            hint="Turn off to stop new sign-ups."
            checked={draft.registration_enabled}
            disabled={!isSuper}
            onChange={(value) => set("registration_enabled", value)}
          />
          <Toggle
            label="Maintenance mode"
            hint="Locks the app for all non-staff members."
            checked={draft.maintenance_mode}
            disabled={!isSuper}
            onChange={(value) => set("maintenance_mode", value)}
          />
          <Toggle
            label="Require identity verification"
            hint="Members must be verified before contacting others."
            checked={draft.verification_required}
            disabled={!isSuper}
            onChange={(value) => set("verification_required", value)}
          />
        </Panel>

        <Panel className="space-y-4">
          <h2 className="text-sm font-semibold text-cream">Media limits</h2>
          <Row label="Max gallery photos">
            <AdminInput
              type="number"
              min={1}
              max={50}
              disabled={!isSuper}
              value={draft.max_gallery_photos}
              onChange={(event) => set("max_gallery_photos", Number(event.target.value))}
            />
          </Row>
          <Row label="Max image size (MB)">
            <AdminInput
              type="number"
              min={1}
              max={25}
              disabled={!isSuper}
              value={draft.max_image_mb}
              onChange={(event) => set("max_image_mb", Number(event.target.value))}
            />
          </Row>
          <Row label="Allowed image types">
            <AdminInput
              disabled={!isSuper}
              value={draft.allowed_image_types}
              onChange={(event) => set("allowed_image_types", event.target.value)}
              placeholder="image/jpeg, image/png, image/webp"
            />
          </Row>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-wide text-cream/45">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-cream/5 px-3 py-2.5">
      <div>
        <p className="text-sm font-semibold text-cream">{label}</p>
        <p className="text-xs text-cream/45">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${checked ? "bg-gold" : "bg-cream/20"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-navy transition-all ${checked ? "start-[22px]" : "start-0.5"}`}
        />
      </button>
    </div>
  );
}
