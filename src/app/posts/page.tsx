import { Suspense } from "react";
import { PostsList } from "@/features/posts/PostsList";

export default function PostsPage() {
  return (
    <main className="p-6">
      <Suspense fallback={<p>Carregando posts...</p>}>
        <PostsList />
      </Suspense>
    </main>
  );
}
