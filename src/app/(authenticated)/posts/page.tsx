import { Suspense } from "react";
import { PostsList } from "@/features/posts/PostsList";

export default function PostsPage() {
  return (
    <Suspense fallback={<p>Carregando posts...</p>}>
      <PostsList />
    </Suspense>
  );
}
