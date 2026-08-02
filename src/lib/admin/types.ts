export type AppRole = "user" | "moderator" | "admin";

export type DashboardStats = {
  usersTotal: number;
  usersNew7d: number;
  usersActive24h: number;
  subscriptionsByPlan: Record<string, number>;
  revenueThisMonthCents: number;
  reportsOpen: number;
  verificationsPending: number;
  messages7d: number;
  timeseries: { date: string; signups: number; revenueCents: number }[];
};

export type AdminUserRow = {
  id: string;
  display_name: string;
  city: string | null;
  country_code: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
  last_seen_at: string;
  roles: AppRole[];
};

export type PagedResult<T> = { rows: T[]; total: number; page: number; pageSize: number };
