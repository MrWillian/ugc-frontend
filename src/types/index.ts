/** Domínio espelhado do NestJS/Prisma — naming misto intencional (camelCase vs snake_case). */

// ─── Enums / unions ───────────────────────────────────────────────────────────

export type Plan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | null;

export type PlatformAccountStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RightsStatus = "PENDING" | "GRANTED" | "REJECTED";

export type DisplayStatus = "VISIBLE" | "HIDDEN";

export type ContentPlatform = "INSTAGRAM";

export type ContentType = "IMAGE" | "VIDEO" | "CAROUSEL";

export type WidgetLayout = "GRID" | "CAROUSEL" | "MASONRY";

export type ConsentChannel = "EMAIL" | "WHATSAPP" | "DIRECT_MESSAGE";

/** Channels no body de generate (DTO lowercase). */
export type ConsentChannelInput = "email" | "whatsapp" | "direct_message";

export type PermissionStatus = "pending" | "granted" | "rejected";

export type ConsentDecision = "granted" | "rejected";

export type CheckoutPlan = "STARTER" | "PRO" | "ENTERPRISE";

// ─── Paginação / erros ────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ─── Auth / Client ────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  email: string;
  name: string;
  subdomain: string;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  client: Client;
}

export interface SignupBody {
  email: string;
  password: string;
  name: string;
  subdomain: string;
  plan?: Plan;
  companyName?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

// ─── Instagram / PlatformAccount ──────────────────────────────────────────────

export interface InstagramAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface InstagramCallbackBody {
  code: string;
  state: string;
}

export interface InstagramStatus {
  connected: boolean;
  status: PlatformAccountStatus | null;
  accountId: string | null;
  accountUsername: string | null;
  pageName: string | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  reconnectRequired: boolean;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  hashtag: string;
  termsText: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Body de criação — `terms_text` em snake_case (DTO). */
export interface CreateCampaignBody {
  name: string;
  hashtag: string;
  terms_text?: string;
}

export interface UpdateCampaignBody {
  name?: string;
  hashtag?: string;
  terms_text?: string;
  active?: boolean;
}

// ─── CollectedPost / Moderação ────────────────────────────────────────────────

export interface AuthorData {
  username?: string;
  [key: string]: unknown;
}

export interface PostMetrics {
  likes?: number;
  comments?: number;
  [key: string]: unknown;
}

export interface CollectedPost {
  id: string;
  campaignId: string;
  platform: ContentPlatform;
  externalId: string;
  contentType: ContentType;
  contentUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  authorData: AuthorData | null;
  metrics: PostMetrics | null;
  postedAt: string;
  status: ModerationStatus;
  rightsStatus: RightsStatus;
  displayStatus: DisplayStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationResult {
  id: string;
  postId: string;
  decision: "APPROVED" | "REJECTED" | string;
  rejectionReasons?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface CollectedPostDetail extends CollectedPost {
  moderationResults: ModerationResult[];
}

/** Resposta de approve — inclui `consent_link` (snake_case). */
export interface ApprovePostResponse extends CollectedPost {
  consent_link: string;
}

export interface RejectPostBody {
  rejection_reasons: string;
}

export type PostListStatusQuery = "pending" | "approved" | "rejected";

// ─── Consentimento / UgcPermission ────────────────────────────────────────────

export interface UgcPermission {
  id: string;
  channel: ConsentChannel;
  status: PermissionStatus;
  consentUrl: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
}

export interface ConsentStatusResult {
  postId: string;
  rightsStatus: RightsStatus;
  displayStatus: DisplayStatus;
  permission: UgcPermission | null;
}

export interface GenerateConsentBody {
  channel?: ConsentChannelInput;
  email?: string;
}

export interface ConsentDecisionBody {
  token: string;
  decision: ConsentDecision;
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export interface WidgetFilters {
  maxPosts?: number;
  showCaptions?: boolean;
  theme?: string;
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  clientId: string;
  name: string;
  layout: WidgetLayout;
  filters: WidgetFilters | null;
  embedCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetBody {
  name: string;
  layout?: WidgetLayout;
  filters?: WidgetFilters;
}

export interface UpdateWidgetBody {
  name?: string;
  layout?: WidgetLayout;
  filters?: WidgetFilters;
}

/** Item público do widget (snake_case). */
export interface PublicWidgetPost {
  id: string;
  content_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  author_data: { username?: string; [key: string]: unknown } | null;
  posted_at: string;
}

// ─── Subscription / Stripe ────────────────────────────────────────────────────

export interface CurrentSubscription {
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface CreateCheckoutBody {
  priceId?: string;
  plan?: CheckoutPlan;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface CancelSubscriptionResponse {
  subscriptionStatus: "canceled";
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}
