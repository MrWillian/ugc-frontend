import { describe, expect, it } from "vitest";
import type { CollectedPost } from "@/types";
import { bucketPostsByDay, countCreatedToday } from "./bucket-posts-by-day";

function post(createdAt: string, status: CollectedPost["status"] = "PENDING"): CollectedPost {
  return {
    id: createdAt,
    campaignId: "c1",
    platform: "INSTAGRAM",
    externalId: "e1",
    contentType: "IMAGE",
    contentUrl: "https://example.com/a.jpg",
    thumbnailUrl: null,
    caption: null,
    authorData: null,
    metrics: null,
    postedAt: createdAt,
    status,
    rightsStatus: "PENDING",
    displayStatus: "HIDDEN",
    createdAt,
    updatedAt: createdAt,
  };
}

describe("bucketPostsByDay", () => {
  it("counts posts on the correct local calendar day", () => {
    const now = new Date("2026-09-29T15:00:00");
    const posts = [post("2026-09-29T10:00:00"), post("2026-09-28T10:00:00")];

    const buckets = bucketPostsByDay(posts, 7, now);
    const today = buckets.find((b) => b.dateKey === "2026-8-29");
    const yesterday = buckets.find((b) => b.dateKey === "2026-8-28");

    expect(today?.count).toBe(1);
    expect(yesterday?.count).toBe(1);
  });
});

describe("countCreatedToday", () => {
  it("filters by predicate when provided", () => {
    const now = new Date("2026-09-29T12:00:00");
    const posts = [
      post("2026-09-29T08:00:00", "PENDING"),
      post("2026-09-29T09:00:00", "APPROVED"),
    ];

    expect(
      countCreatedToday(posts, now, (p) => p.status === "APPROVED"),
    ).toBe(1);
  });
});
