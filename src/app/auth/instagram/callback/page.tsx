import { InstagramCallback } from "@/features/instagram/InstagramCallback";
import { Suspense } from "react";

export default function InstagramCallbackPage() {
  return (
    <Suspense fallback={<main className="p-6">Carregando retorno do Instagram...</main>}>
      <InstagramCallback />
    </Suspense>
  );
}
