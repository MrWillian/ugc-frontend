import { fetchPosts } from "@/features/posts/api";
import type { CollectedPost } from "@/types";

export const POST_SAMPLE_CAP = 500;

export async function fetchPostSample(
  maxPosts = POST_SAMPLE_CAP,
): Promise<CollectedPost[]> {
  const collected: CollectedPost[] = [];
  let page = 1;

  while (collected.length < maxPosts) {
    const response = await fetchPosts({ page, limit: 100 });
    collected.push(...response.data);
    if (page >= response.meta.totalPages || response.data.length === 0) {
      break;
    }
    page += 1;
  }

  return collected.slice(0, maxPosts);
}
