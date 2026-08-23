import type {
  ApprovePostResponse,
  CollectedPost,
  CollectedPostDetail,
  ConsentStatusResult,
  ModerationQuery,
  PaginatedResponse,
  PostListStatusQuery,
  RejectPostBody,
} from "@/types";

const DEFAULT_LIMIT = 20;

async function responseMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message?: unknown };

    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === "string")
        .join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Não foi possível concluir a solicitação.";
}

export function buildPostsQuery(query: ModerationQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? DEFAULT_LIMIT));
  if (query.status) params.set("status", query.status);
  return params.toString();
}

export function postsListPath(query: ModerationQuery): string {
  const qs = buildPostsQuery(query);
  if (query.campaignId) {
    return `/api/campaigns/${encodeURIComponent(query.campaignId)}/posts?${qs}`;
  }
  return `/api/posts?${qs}`;
}

export async function fetchPosts(
  query: ModerationQuery,
): Promise<PaginatedResponse<CollectedPost>> {
  const response = await fetch(postsListPath(query), {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return response.json() as Promise<PaginatedResponse<CollectedPost>>;
}

export async function approvePost(id: string): Promise<ApprovePostResponse> {
  const response = await fetch(`/api/posts/${id}/approve`, {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return response.json() as Promise<ApprovePostResponse>;
}

export async function rejectPost(
  id: string,
  body: RejectPostBody,
): Promise<CollectedPost> {
  const response = await fetch(`/api/posts/${id}/reject`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return response.json() as Promise<CollectedPost>;
}

export async function fetchPost(id: string): Promise<CollectedPostDetail> {
  const response = await fetch(`/api/posts/${id}`, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return response.json() as Promise<CollectedPostDetail>;
}

export async function fetchConsentStatus(
  postId: string,
): Promise<ConsentStatusResult> {
  const response = await fetch(`/api/posts/${postId}/consent/status`, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return response.json() as Promise<ConsentStatusResult>;
}

export async function resendConsent(permissionId: string): Promise<void> {
  const response = await fetch(`/api/consent/resend/${permissionId}`, {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }
}

export function isPostListStatus(value: string | null): value is PostListStatusQuery {
  return value === "pending" || value === "approved" || value === "rejected";
}
