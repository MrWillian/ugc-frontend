import { Suspense } from "react";
import { ModerationQueue } from "@/features/posts/ModerationQueue";

export default function ModerationPage() {
  return (
    <main className="p-6">
      <Suspense fallback={<p>Carregando posts pendentes...</p>}>
        <ModerationQueue />
      </Suspense>
    </main>
  );
}
