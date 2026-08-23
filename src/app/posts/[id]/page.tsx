import { PostDetail } from "@/features/posts/PostDetail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-6">
      <PostDetail postId={id} />
    </main>
  );
}
