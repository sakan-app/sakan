import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownUp, MoreHorizontal } from "lucide-react";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Panel,
  Pill,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import { changeUserRoleV2, listUsersAdvanced, runUserAction } from "@/lib/admin/ops.functions";
import { useAdminAccess } from "@/routes/admin/route";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users · SAKAN Admin" },
      { name: "description", content: "Search, moderate and manage every SAKAN member." },
      { property: "og:title", content: "Users · SAKAN Admin" },
      { property: "og:description", content: "Search, moderate and manage every SAKAN member." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsers,
  errorComponent: RouteErrorBoundary,
});

type Sort = "created_at" | "last_seen_at" | "display_name" | "completeness";

function age(birthDate: string | null): string {
  if (!birthDate) return "—";
  const diff = Date.now() - new Date(birthDate).getTime();
  return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

function AdminUsers() {
  const listFn = useServerFn(listUsersAdvanced);
  const actionFn = useServerFn(runUserAction);
  const roleFn = useServerFn(changeUserRoleV2);
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const [, confirm, , confirmNode] = useConfirm();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended" | "shadow_banned">("all");
  const [verified, setVerified] = useState<"all" | "verified" | "unverified">("all");
  const [role, setRole] = useState<"all" | "user" | "moderator" | "admin" | "super_admin">("all");
  const [sort, setSort] = useState<Sort>("created_at");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const params = useMemo(
    () => ({ search: search || undefined, status, verified, role, sort, direction, page, pageSize: 20 }),
    [search, status, verified, role, sort, direction, page],
  );

  const users = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => listFn({ data: params }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "live-stats"] });
  };

  const action = useMutation({
    mutationFn: (input: { targetId: string; action: Parameters<typeof runUserAction>[0]["data"]["action"]; reason?: string }) =>
      actionFn({ data: input }),
    onSuccess: () => {
      toast.success("Action applied");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Action failed"),
  });

  const roleChange = useMutation({
    mutationFn: (input: { targetId: string; role: "user" | "moderator" | "admin" | "super_admin"; grant: boolean }) =>
      roleFn({ data: input }),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Role change failed"),
  });

  const toggleSort = (next: Sort) => {
    if (sort === next) setDirection(direction === "asc" ? "desc" : "asc");
    else {
      setSort(next);
      setDirection("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {confirmNode}
      <AdminPageHeader title="Users" subtitle="Search, moderate and manage every SAKAN member." />

      <Panel className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <AdminInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or city…"
          />
          <AdminSelect
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="shadow_banned">Shadow banned</option>
          </AdminSelect>
          <AdminSelect
            value={verified}
            onChange={(event) => {
              setVerified(event.target.value as typeof verified);
              setPage(1);
            }}
          >
            <option value="all">Any verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </AdminSelect>
          <AdminSelect
            value={role}
            onChange={(event) => {
              setRole(event.target.value as typeof role);
              setPage(1);
            }}
          >
            <option value="all">Any role</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </AdminSelect>
        </div>

        {users.isLoading ? <LoadingState /> : null}
        {users.isError ? <ErrorState message="Could not load users." onRetry={() => void users.refetch()} /> : null}

        {users.data ? (
          users.data.rows.length === 0 ? (
            <EmptyState label="No users match these filters." />
          ) : (
            <>
              <TableShell
                caption="Members table"
                head={
                  <tr>
                    <Th>Member</Th>
                    <Th>Email</Th>
                    <Th>Country</Th>
                    <Th>Age</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Plan</Th>
                    <Th>
                      <button type="button" onClick={() => toggleSort("completeness")} className="inline-flex items-center gap-1">
                        Profile <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </Th>
                    <Th>
                      <button type="button" onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1">
                        Joined <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </Th>
                    <Th>
                      <button type="button" onClick={() => toggleSort("last_seen_at")} className="inline-flex items-center gap-1">
                        Last active <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </Th>
                    <Th className="text-end">Actions</Th>
                  </tr>
                }
              >
                {users.data.rows.map((user) => (
                  <tr key={user.id} className="hover:bg-cream/4">
                    <Td>
                      <Link to="/admin/user/$id" params={{ id: user.id }} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                          {user.display_name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-semibold text-cream">{user.display_name}</span>
                          <span className="block text-xs text-cream/45">{user.city ?? "—"}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="text-xs">{user.email ?? "—"}</Td>
                    <Td className="text-xs uppercase">{user.country_code ?? "—"}</Td>
                    <Td className="text-xs">{age(user.birth_date)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <Pill>user</Pill>
                        ) : (
                          user.roles.map((r) => (
                            <Pill key={r} tone={r === "user" ? "neutral" : "gold"}>
                              {r}
                            </Pill>
                          ))
                        )}
                      </div>
                    </Td>
                    <Td>
                      {!user.is_active ? (
                        <Pill tone="danger">suspended</Pill>
                      ) : user.is_hidden ? (
                        <Pill tone="warning">shadow banned</Pill>
                      ) : user.is_verified ? (
                        <Pill tone="success">verified</Pill>
                      ) : (
                        <Pill>active</Pill>
                      )}
                    </Td>
                    <Td className="text-xs">
                      {user.plan_code ? `${user.plan_code} · ${user.subscription_status}` : "free"}
                    </Td>
                    <Td className="text-xs tabular-nums">{user.completeness ?? 0}%</Td>
                    <Td className="text-xs tabular-nums">{user.created_at.slice(0, 10)}</Td>
                    <Td className="text-xs tabular-nums">{user.last_seen_at.slice(0, 10)}</Td>
                    <Td className="text-end">
                      <div className="relative inline-block">
                        <ActionButton onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)} aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </ActionButton>
                        {openMenu === user.id ? (
                          <div className="glass-card absolute end-0 z-50 mt-2 w-52 rounded-xl p-1.5 text-start">
                            <Link
                              to="/admin/user/$id"
                              params={{ id: user.id }}
                              className="block rounded-lg px-3 py-2 text-xs text-cream/80 hover:bg-cream/8"
                            >
                              View profile
                            </Link>
                            <MenuItem
                              label={user.is_active ? "Suspend" : "Unsuspend"}
                              onClick={() =>
                                confirm({
                                  title: user.is_active ? `Suspend ${user.display_name}?` : `Unsuspend ${user.display_name}?`,
                                  description: "The member will be signed out and hidden from search while suspended.",
                                  destructive: user.is_active,
                                  requireReason: user.is_active,
                                  onConfirm: (reason) =>
                                    action.mutateAsync({
                                      targetId: user.id,
                                      action: user.is_active ? "suspend" : "unsuspend",
                                      reason,
                                    }),
                                })
                              }
                            />
                            <MenuItem
                              label={user.is_hidden ? "Remove shadow ban" : "Shadow ban"}
                              onClick={() =>
                                action.mutate({ targetId: user.id, action: user.is_hidden ? "unshadow_ban" : "shadow_ban" })
                              }
                            />
                            <MenuItem
                              label={user.is_verified ? "Remove verification" : "Verify account"}
                              onClick={() => action.mutate({ targetId: user.id, action: user.is_verified ? "unverify" : "verify" })}
                            />
                            <MenuItem label="Reset password" onClick={() => action.mutate({ targetId: user.id, action: "reset_password" })} />
                            <MenuItem label="Force logout" onClick={() => action.mutate({ targetId: user.id, action: "force_logout" })} />
                            {access.data?.isAdmin ? (
                              <>
                                <div className="my-1 border-t border-cream/10" />
                                <MenuItem
                                  label={user.roles.includes("moderator") ? "Demote moderator" : "Promote to moderator"}
                                  onClick={() =>
                                    confirm({
                                      title: "Change role",
                                      description: `${user.roles.includes("moderator") ? "Revoke" : "Grant"} the moderator role for ${user.display_name}.`,
                                      onConfirm: () =>
                                        roleChange.mutateAsync({
                                          targetId: user.id,
                                          role: "moderator",
                                          grant: !user.roles.includes("moderator"),
                                        }),
                                    })
                                  }
                                />
                                <MenuItem
                                  label={user.roles.includes("admin") ? "Demote admin" : "Promote to admin"}
                                  onClick={() =>
                                    confirm({
                                      title: "Change role",
                                      description: `${user.roles.includes("admin") ? "Revoke" : "Grant"} the admin role for ${user.display_name}.`,
                                      destructive: true,
                                      requireReason: true,
                                      onConfirm: () =>
                                        roleChange.mutateAsync({
                                          targetId: user.id,
                                          role: "admin",
                                          grant: !user.roles.includes("admin"),
                                        }),
                                    })
                                  }
                                />
                                <MenuItem
                                  label="Delete account"
                                  destructive
                                  onClick={() =>
                                    confirm({
                                      title: `Delete ${user.display_name}?`,
                                      description: "This permanently removes the auth account and all owned data. It cannot be undone.",
                                      destructive: true,
                                      requireReason: true,
                                      confirmLabel: "Delete permanently",
                                      onConfirm: (reason) => action.mutateAsync({ targetId: user.id, action: "delete", reason }),
                                    })
                                  }
                                />
                              </>
                            ) : null}
                            {access.data?.isSuperAdmin ? (
                              <MenuItem
                                label={user.roles.includes("super_admin") ? "Demote super admin" : "Promote to super admin"}
                                onClick={() =>
                                  confirm({
                                    title: "Change role",
                                    description: `${user.roles.includes("super_admin") ? "Revoke" : "Grant"} the super admin role for ${user.display_name}.`,
                                    destructive: true,
                                    requireReason: true,
                                    onConfirm: () =>
                                      roleChange.mutateAsync({
                                        targetId: user.id,
                                        role: "super_admin",
                                        grant: !user.roles.includes("super_admin"),
                                      }),
                                  })
                                }
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </TableShell>
              <Pagination page={users.data.page} pageSize={users.data.pageSize} total={users.data.total} onPage={setPage} />
            </>
          )
        ) : null}
      </Panel>
    </div>
  );
}

function MenuItem({ label, onClick, destructive }: { label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-start text-xs hover:bg-cream/8 ${
        destructive ? "text-red-300" : "text-cream/80"
      }`}
    >
      {label}
    </button>
  );
}
