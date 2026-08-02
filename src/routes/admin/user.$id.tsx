import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminPageHeader,
  ErrorState,
  LoadingState,
  Panel,
  Pill,
  StatCard,
} from "@/components/admin/ui";
import { addAdminNote, getUserDetailFull, runUserAction } from "@/lib/admin/ops.functions";
import { useAdminAccess } from "@/routes/admin/route";

export const Route = createFileRoute("/admin/user/$id")({ component: AdminUserDetail });

function AdminUserDetail() {
  const { id } = Route.useParams();
  const detailFn = useServerFn(getUserDetailFull);
  const actionFn = useServerFn(runUserAction);
  const noteFn = useServerFn(addAdminNote);
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const [, confirm, , confirmNode] = useConfirm();
  const [note, setNote] = useState("");

  const detail = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => detailFn({ data: { targetId: id } }),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin", "user", id] });

  const action = useMutation({
    mutationFn: (input: { action: Parameters<typeof runUserAction>[0]["data"]["action"]; reason?: string }) =>
      actionFn({ data: { targetId: id, ...input } }),
    onSuccess: () => {
      toast.success("Action applied");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Action failed"),
  });

  const saveNote = useMutation({
    mutationFn: () => noteFn({ data: { targetId: id, note } }),
    onSuccess: () => {
      setNote("");
      toast.success("Note saved");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Could not save note"),
  });

  if (detail.isLoading) return <LoadingState />;
  if (detail.isError || !detail.data) return <ErrorState message="Member not found." onRetry={() => void detail.refetch()} />;

  const d = detail.data;
  const p = d.profile;

  return (
    <div className="space-y-5">
      {confirmNode}
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-xs text-cream/60 hover:text-cream">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to users
      </Link>

      <AdminPageHeader
        title={p.display_name}
        subtitle={`${d.email ?? "no email"} · ${p.city ?? "—"}, ${p.country_code ?? "—"}`}
        actions={
          <>
            <ActionButton onClick={() => action.mutate({ action: p.is_verified ? "unverify" : "verify" })}>
              {p.is_verified ? "Remove verification" : "Verify"}
            </ActionButton>
            <ActionButton onClick={() => action.mutate({ action: p.is_hidden ? "unshadow_ban" : "shadow_ban" })}>
              {p.is_hidden ? "Un-shadow-ban" : "Shadow ban"}
            </ActionButton>
            <ActionButton onClick={() => action.mutate({ action: "force_logout" })}>Force logout</ActionButton>
            <ActionButton onClick={() => action.mutate({ action: "reset_password" })}>Reset password</ActionButton>
            <ActionButton
              tone={p.is_active ? "danger" : "gold"}
              onClick={() =>
                confirm({
                  title: p.is_active ? "Suspend member?" : "Restore member?",
                  destructive: p.is_active,
                  requireReason: p.is_active,
                  onConfirm: (reason) => action.mutateAsync({ action: p.is_active ? "suspend" : "unsuspend", reason }),
                })
              }
            >
              {p.is_active ? "Suspend" : "Unsuspend"}
            </ActionButton>
            {access.data?.isAdmin ? (
              <ActionButton
                tone="danger"
                onClick={() =>
                  confirm({
                    title: `Delete ${p.display_name}?`,
                    description: "This permanently deletes the account. It cannot be undone.",
                    destructive: true,
                    requireReason: true,
                    confirmLabel: "Delete permanently",
                    onConfirm: (reason) => action.mutateAsync({ action: "delete", reason }),
                  })
                }
              >
                Delete
              </ActionButton>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Messages" value={d.stats.messages} />
        <StatCard label="Likes given" value={d.stats.likesGiven} />
        <StatCard label="Likes received" value={d.stats.likesReceived} />
        <StatCard label="Favorites" value={d.stats.favorites} />
        <StatCard label="Matches" value={d.stats.matches} tone="gold" />
        <StatCard label="Reports against" value={d.reportsAgainst.length} tone={d.reportsAgainst.length ? "danger" : "default"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <h2 className="text-sm font-semibold text-cream">Profile</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
            <Field label="Gender" value={p.gender} />
            <Field label="Looking for" value={p.looking_for} />
            <Field label="Birth date" value={p.birth_date} />
            <Field label="Marital status" value={p.marital_status} />
            <Field label="Height" value={p.height_cm ? `${p.height_cm} cm` : null} />
            <Field label="Education" value={p.education} />
            <Field label="Occupation" value={p.occupation} />
            <Field label="Religiosity" value={p.religiosity} />
            <Field label="Language" value={p.preferred_language} />
            <Field label="Completeness" value={`${p.completeness ?? 0}%`} />
            <Field label="Onboarding" value={p.onboarding_complete ? "complete" : "incomplete"} />
            <Field label="Last seen" value={p.last_seen_at?.replace("T", " ").slice(0, 16)} />
          </dl>
          {p.bio ? <p className="mt-4 rounded-xl bg-cream/5 p-3 text-sm leading-relaxed text-cream/75">{p.bio}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {(p.interests ?? []).map((interest: string) => (
              <Pill key={interest}>{interest}</Pill>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold text-cream">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Field label="Email" value={d.email} />
            <Field label="Roles" value={d.roles.join(", ") || "user"} />
            <Field label="Registered" value={d.auth?.created_at?.slice(0, 10) ?? p.created_at.slice(0, 10)} />
            <Field label="Last sign-in" value={d.auth?.last_sign_in_at?.replace("T", " ").slice(0, 16) ?? "—"} />
            <Field label="Email confirmed" value={d.auth?.email_confirmed_at ? "yes" : "no"} />
            <Field label="Providers" value={d.auth?.providers.join(", ") || "email"} />
            <Field label="Banned" value={d.auth?.banned ? "yes" : "no"} />
            <Field
              label="Subscription"
              value={d.subscription ? `${d.subscription.plan_code} · ${d.subscription.status}` : "free"}
            />
          </dl>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-sm font-semibold text-cream">Gallery ({d.gallery.length})</h2>
        {d.gallery.length === 0 ? (
          <p className="py-8 text-center text-sm text-cream/45">No photos uploaded.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {d.gallery.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-xl border border-cream/10">
                {photo.url ? (
                  <img src={photo.url} alt={`${p.display_name} ${photo.kind}`} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="aspect-square w-full bg-cream/5" />
                )}
                <figcaption className="px-2 py-1 text-[10px] text-cream/50">
                  {photo.kind}
                  {photo.is_approved ? "" : " · pending"}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <h2 className="text-sm font-semibold text-cream">Verification history</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {d.verifications.length === 0 ? <li className="text-cream/45">No verification requests.</li> : null}
            {d.verifications.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg bg-cream/5 px-3 py-2">
                <span className="text-cream/70">{v.created_at.slice(0, 10)}</span>
                <Pill tone={v.status === "approved" ? "success" : v.status === "pending" ? "warning" : "danger"}>{v.status}</Pill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold text-cream">Reports against this member</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {d.reportsAgainst.length === 0 ? <li className="text-cream/45">No reports.</li> : null}
            {d.reportsAgainst.map((r) => (
              <li key={r.id} className="rounded-lg bg-cream/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-cream/80">{r.reason}</span>
                  <Pill tone={r.status === "open" ? "danger" : "neutral"}>{r.status}</Pill>
                </div>
                {r.details ? <p className="mt-1 text-cream/55">{r.details}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-sm font-semibold text-cream">Admin notes</h2>
        <div className="mt-3 flex gap-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Internal note, visible to staff only…"
            className="glass-field flex-1 rounded-xl px-3 py-2 text-sm text-cream placeholder:text-cream/35 focus:outline-none"
          />
          <ActionButton tone="gold" disabled={!note.trim() || saveNote.isPending} onClick={() => saveNote.mutate()}>
            Save
          </ActionButton>
        </div>
        <ul className="mt-4 space-y-2 text-xs">
          {d.notes.length === 0 ? <li className="text-cream/45">No notes yet.</li> : null}
          {d.notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-cream/5 px-3 py-2">
              <p className="text-cream/80">{n.note}</p>
              <p className="mt-1 text-cream/40">{n.created_at.replace("T", " ").slice(0, 16)}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="text-sm font-semibold text-cream">Timeline</h2>
        <ol className="mt-4 space-y-3 border-s border-cream/12 ps-4 text-xs">
          {[...d.adminActions.map((a) => ({ at: a.created_at, label: a.action, kind: "admin" as const })),
            ...d.activity.map((a) => ({ at: a.created_at, label: a.event, kind: "system" as const }))]
            .sort((a, b) => (a.at < b.at ? 1 : -1))
            .slice(0, 40)
            .map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="relative">
                <span className="absolute -start-[21px] top-1 h-2 w-2 rounded-full bg-gold" />
                <p className="font-semibold text-cream/80">{entry.label}</p>
                <p className="text-cream/40">
                  {entry.kind} · {entry.at.replace("T", " ").slice(0, 16)}
                </p>
              </li>
            ))}
          {d.adminActions.length === 0 && d.activity.length === 0 ? <li className="text-cream/45">No recorded activity.</li> : null}
        </ol>
      </Panel>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-cream/40">{label}</dt>
      <dd className="text-cream/85">{value ?? "—"}</dd>
    </div>
  );
}
