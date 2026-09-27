import type { JSX } from "react";
import type { PublicWidgetPost, WidgetLayout } from "@/types";

function layoutClass(layout: WidgetLayout): string {
  if (layout === "CAROUSEL") {
    return "flex gap-2 overflow-x-auto";
  }
  if (layout === "MASONRY") {
    return "columns-2 gap-2 sm:columns-3";
  }
  return "grid grid-cols-2 gap-2 sm:grid-cols-3";
}

function itemClass(layout: WidgetLayout): string {
  if (layout === "CAROUSEL") {
    return "min-w-[12rem] shrink-0 overflow-hidden rounded-md border";
  }
  if (layout === "MASONRY") {
    return "mb-2 break-inside-avoid overflow-hidden rounded-md border";
  }
  return "overflow-hidden rounded-md border";
}

export function WidgetPreview(props: {
  layout: WidgetLayout;
  posts: PublicWidgetPost[];
  isLoading: boolean;
  errorMessage: string | null;
}): JSX.Element {
  if (props.isLoading) {
    return <p>Carregando prévia...</p>;
  }

  if (props.errorMessage) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {props.errorMessage}
      </p>
    );
  }

  if (props.posts.length === 0) {
    return (
      <p>
        Nenhum post visível neste widget. Só entram posts com consentimento
        concedido e display visível.
      </p>
    );
  }

  return (
    <div className={layoutClass(props.layout)}>
      {props.posts.map((post) => {
        const src = post.thumbnail_url ?? post.content_url;
        const username =
          post.author_data && typeof post.author_data.username === "string"
            ? post.author_data.username
            : null;
        return (
          <article className={itemClass(props.layout)} key={post.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={post.caption ?? ""}
              className="h-auto w-full object-cover"
              src={src}
            />
            <div className="space-y-1 p-2 text-sm">
              {username ? <p>@{username}</p> : null}
              {post.caption ? <p>{post.caption}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
