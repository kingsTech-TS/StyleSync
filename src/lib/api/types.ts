import type { components } from "./schema";

type S = components["schemas"];

// Generated from the backend's OpenAPI schema (bun run gen:api).
export type UserOut = S["UserOut"];
export type TokenOut = S["TokenOut"];
export type PublicProfileOut = S["PublicProfileOut"];
export type AvatarOut = S["AvatarOut"];
export type AvatarEditIn = S["AvatarEditIn"];
export type CollectionOut = S["CollectionOut"];
export type ItemOut = S["ItemOut"];
export type ItemCreateIn = S["ItemCreateIn"];
export type ItemUpdateIn = S["ItemUpdateIn"];
export type AnalyzeOut = S["AnalyzeOut"];
export type OutfitOut = S["OutfitOut"];
export type OutfitItemOut = S["OutfitItemOut"];
export type RenderInfo = S["RenderInfo"];
export type OptionsOut = S["OptionsOut"];
export type OptionTheme = S["OptionTheme"];
export type WeatherOut = S["WeatherOut"];
export type GenerateIn = S["GenerateIn"];
export type CommentOut = S["CommentOut"];
export type SessionOut = S["SessionOut"];
export type ChatMessageOut = S["ChatMessageOut"];
export type ThemeIn = S["ThemeIn"];
export type ThemeUpdateIn = S["ThemeUpdateIn"];
export type QuotaIn = S["QuotaIn"];
export type Category = S["Category"];
export type Slot = S["Slot"];
export type AgeRange = S["AgeRange"];
export type Sex = S["Sex"];
export type CommentPolicy = S["CommentPolicy"];
export type ReportTarget = S["ReportTarget"];
export type OutfitSource = S["OutfitSource"];

export type OutfitStatus = "ok" | "partial" | "not_possible";

// ---------- hand-written: these endpoints return plain dicts ----------

export interface FeedPage {
  items: OutfitOut[];
  next_cursor: string | null;
}

export type AIMode = "normal" | "saver" | "offline";
export type QuotaFeature = "tag" | "generate" | "chat" | "render" | "avatar";

export interface QuotaUse {
  used: number;
  limit: number;
  remaining: number;
  period: "day" | "week";
}

export interface AIUsage {
  mode: AIMode;
  quotas: Record<QuotaFeature, QuotaUse>;
}

export interface PreviewOut {
  svg: string;
  problems: string[];
}

export interface FollowUser {
  username: string;
  avatar_image_url: string | null;
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  full_name: string;
  age_range: AgeRange;
  sex: Sex;
  role: "user" | "admin";
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  item_count: number;
  outfit_count: number;
  follower_count: number;
}

export interface AdminUsersPage {
  total: number;
  items: AdminUserRow[];
}

export interface AIBudget {
  cycle_days: number;
  budget_usd: number;
  spent_usd: number;
  remaining_usd: number;
  used_fraction: number;
  by_model: Record<string, number>;
  by_feature: Record<string, number>;
  calls: number;
  projected_run_out: string | null;
  mode: AIMode;
}

export interface AdminHealth {
  database: boolean;
  storage: boolean;
  ai_gateway: boolean;
  background_tasks_pending: number;
  last_24h: {
    ai_calls: number;
    ai_error_rate: number;
    render_failures: number;
    avg_latency_ms_by_model: Record<string, number>;
    cost_usd: number;
  };
  ai_budget: AIBudget;
}

export interface AdminStats {
  totals: {
    users: number;
    items: number;
    outfits: number;
    published_outfits: number;
    likes: number;
    comments: number;
    follows: number;
  };
  per_day: Record<"users" | "outfits" | "likes" | "comments" | "follows" | "ai_calls", Record<string, number>>;
}

export interface Quotas {
  tag: number;
  generate: number;
  chat: number;
  render: number;
  avatar_per_week: number;
}

export interface AdminTheme {
  id: string;
  slug: string;
  name: string;
  description: string;
  styling_rules: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AdminReport {
  id: string;
  reporter_id?: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  status: "open" | "resolved";
  created_at: string;
  [key: string]: unknown;
}

export const CATEGORIES: Category[] = [
  "top", "bottom", "dress", "outerwear", "shoes", "accessory", "bag", "headwear", "other",
];

export const SLOTS: Slot[] = [
  "top", "bottom", "dress", "outerwear", "shoes", "headwear", "bag", "accessory_1", "accessory_2", "accessory_3",
];

export const AGE_RANGES: AgeRange[] = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"];
