import type { CollectedPost } from "@/types";

const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

export interface DayBucket {
  label: string;
  count: number;
  dateKey: string;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function bucketPostsByDay(
  posts: CollectedPost[],
  days: number,
  now: Date = new Date(),
): DayBucket[] {
  const end = startOfLocalDay(now);
  const buckets: DayBucket[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(end);
    day.setDate(end.getDate() - i);
    buckets.push({
      label: WEEKDAY_LABELS[day.getDay()] ?? "dom",
      count: 0,
      dateKey: dateKey(day),
    });
  }

  const bucketByKey = new Map(buckets.map((b) => [b.dateKey, b]));

  for (const post of posts) {
    const created = new Date(post.createdAt);
    const key = dateKey(startOfLocalDay(created));
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

export function countCreatedToday(
  posts: CollectedPost[],
  now: Date = new Date(),
  predicate?: (post: CollectedPost) => boolean,
): number {
  const todayKey = dateKey(startOfLocalDay(now));
  return posts.filter((post) => {
    if (predicate && !predicate(post)) return false;
    return dateKey(startOfLocalDay(new Date(post.createdAt))) === todayKey;
  }).length;
}
