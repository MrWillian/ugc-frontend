import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { fetchRecentPosts } from "@/features/dashboard/server-api";
import { POST_SAMPLE_CAP } from "@/features/dashboard/post-sample";
import type { CollectedPost } from "@/types";

const VISIBLE_ITEMS = 10;

function formatRelative(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function authorHandle(post: CollectedPost): string {
  const username = post.authorData?.username;
  if (typeof username === "string" && username.length > 0) {
    return `@${username}`;
  }
  return "Autor desconhecido";
}

const ROW = "flex gap-3 py-3";
const THUMB = "size-12 shrink-0 rounded-lg";

/** Mirrors ActivityRow below; keep the two in step. */
function ActivityRowSkeleton() {
  return (
    <li className={ROW} aria-hidden>
      <span className={`${THUMB} animate-pulse bg-muted`} />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full max-w-sm animate-pulse rounded bg-muted" />
      </div>
    </li>
  );
}

export function DashboardActivityFeedSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 4 }, (_, index) => (
        <ActivityRowSkeleton key={index} />
      ))}
    </ul>
  );
}

function ActivityRow({ post }: { post: CollectedPost }) {
  return (
    <li>
      <Link
        className={`${ROW} transition-colors hover:bg-muted/30`}
        href={`/posts/${post.id}`}
      >
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className={`${THUMB} object-cover`} src={post.thumbnailUrl} />
        ) : (
          <span className={`${THUMB} bg-muted`} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium">{authorHandle(post)}</span>
            <div className="flex shrink-0 items-center gap-2">
              <time
                className="text-xs text-muted-foreground whitespace-nowrap tabular-nums"
                dateTime={post.createdAt}
              >
                {formatRelative(post.createdAt)}
              </time>
              <StatusBadge status={post.status} />
            </div>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {post.caption ?? "Sem legenda"}
          </p>
        </div>
      </Link>
    </li>
  );
}

async function ActivityFeedItems() {
  let posts: CollectedPost[];
  try {
    posts = await fetchRecentPosts(POST_SAMPLE_CAP);
  } catch {
    return (
      <p className="text-sm text-destructive" role="alert">
        Não foi possível carregar atividades.
      </p>
    );
  }

  const recent = [...posts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, VISIBLE_ITEMS);

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>;
  }

  return (
    <ul className="divide-y" data-testid="activity-feed-items">
      {recent.map((post) => (
        <ActivityRow key={post.id} post={post} />
      ))}
    </ul>
  );
}

export function DashboardActivityFeed() {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Atividades recentes</h2>
      <Suspense fallback={<DashboardActivityFeedSkeleton />}>
        <ActivityFeedItems />
      </Suspense>
    </section>
  );
}
