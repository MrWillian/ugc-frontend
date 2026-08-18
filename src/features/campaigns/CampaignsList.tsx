"use client";

import Link from "next/link";
import { useEffect, useState, type JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCampaigns, updateCampaign } from "@/features/campaigns/api";
import type { Campaign } from "@/types";

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

export function CampaignsList(): JSX.Element {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const payload = await fetchCampaigns();
        if (active) {
          setCampaigns(payload);
          setError("");
        }
      } catch (reason) {
        if (active) {
          setError(requestError(reason));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function toggleActive(campaign: Campaign) {
    setPendingId(campaign.id);
    setError("");

    try {
      const updated = await updateCampaign(campaign.id, {
        active: !campaign.active,
      });
      setCampaigns((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (reason) {
      setError(requestError(reason));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
        <Button asChild>
          <Link href="/campaigns/new">Nova Campanha</Link>
        </Button>
      </div>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p>Carregando campanhas...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Hashtag</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>Nenhuma campanha cadastrada.</TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>{campaign.hashtag}</TableCell>
                  <TableCell>
                    <Badge variant={campaign.active ? "default" : "secondary"}>
                      {campaign.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCreatedAt(campaign.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/campaigns/${campaign.id}/edit`}>Editar</Link>
                      </Button>
                      <Button
                        disabled={pendingId === campaign.id}
                        onClick={() => void toggleActive(campaign)}
                        size="sm"
                        variant="outline"
                      >
                        {campaign.active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/posts?campaignId=${campaign.id}`}>
                          Ver Posts
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
