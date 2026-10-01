"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DashboardFilterPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "approved">("pending");
  const [search, setSearch] = useState("");

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Filtrar posts</h2>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Status</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              type="button"
              variant={status === "pending" ? "default" : "outline"}
              onClick={() => setStatus("pending")}
            >
              Pendente
            </Button>
            <Button
              size="sm"
              type="button"
              variant={status === "approved" ? "default" : "outline"}
              onClick={() => setStatus("approved")}
            >
              Aprovado
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="dash-filter-search">
            Hashtag / busca
          </label>
          <input
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            id="dash-filter-search"
            placeholder="#praia"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          className="w-full"
          type="button"
          onClick={() => {
            const params = new URLSearchParams({ status });
            const term = search.trim().replace(/^#/, "");
            if (term) params.set("search", term);
            router.push(`/posts?${params.toString()}`);
          }}
        >
          Aplicar filtros
        </Button>
      </div>
    </section>
  );
}
