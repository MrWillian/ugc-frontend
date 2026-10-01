import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPostSample, POST_SAMPLE_CAP } from "./post-sample";

vi.mock("@/features/posts/api", () => ({
  fetchPosts: vi.fn(),
}));

import { fetchPosts } from "@/features/posts/api";

describe("fetchPostSample", () => {
  beforeEach(() => {
    vi.mocked(fetchPosts).mockReset();
  });

  it("stops at POST_SAMPLE_CAP", async () => {
    vi.mocked(fetchPosts).mockImplementation(async ({ page }) => ({
      data: Array.from({ length: 100 }, (_, i) => ({
        id: `p-${page}-${i}`,
        campaignId: "c",
        platform: "INSTAGRAM" as const,
        externalId: "e",
        contentType: "IMAGE" as const,
        contentUrl: "u",
        thumbnailUrl: null,
        caption: null,
        authorData: null,
        metrics: null,
        postedAt: "2026-01-01",
        status: "PENDING" as const,
        rightsStatus: "PENDING" as const,
        displayStatus: "HIDDEN" as const,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      })),
      meta: { page: page ?? 1, limit: 100, total: 1000, totalPages: 10 },
    }));

    const sample = await fetchPostSample();
    expect(sample).toHaveLength(POST_SAMPLE_CAP);
    expect(fetchPosts).toHaveBeenCalledTimes(5);
  });
});
