const ALLOWED_POST_QUERY_KEYS = new Set(["page", "limit", "status"]);

export function allowedPostsSearch(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (ALLOWED_POST_QUERY_KEYS.has(key) && value.trim()) {
      params.append(key, value.trim());
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
