"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCampaign, fetchCampaign, updateCampaign } from "@/features/campaigns/api";
import {
  campaignEditSchema,
  type CampaignEditValues,
  type CampaignFormValues,
} from "@/features/campaigns/schemas";
import type { CreateCampaignBody } from "@/types";

type CampaignFormProps =
  | { mode: "create"; campaignId?: undefined }
  | { mode: "edit"; campaignId: string };

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

function toCreateBody(values: CampaignFormValues): CreateCampaignBody {
  const body: CreateCampaignBody = {
    name: values.name,
    hashtag: values.hashtag,
  };
  const terms = values.terms_text.trim();
  if (terms) {
    body.terms_text = terms;
  }
  return body;
}

export function CampaignForm(props: CampaignFormProps): JSX.Element {
  const router = useRouter();
  const [requestFailure, setRequestFailure] = useState("");
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(props.mode === "edit");
  const isEdit = props.mode === "edit";
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CampaignEditValues>({
    resolver: zodResolver(campaignEditSchema),
    defaultValues: {
      name: "",
      hashtag: "",
      terms_text: "",
      active: true,
    },
  });

  useEffect(() => {
    if (props.mode !== "edit") {
      return;
    }

    const campaignId = props.campaignId;
    let active = true;

    async function load() {
      setIsLoadingCampaign(true);
      try {
        const campaign = await fetchCampaign(campaignId);
        if (active) {
          reset({
            name: campaign.name,
            hashtag: campaign.hashtag,
            terms_text: campaign.termsText ?? "",
            active: campaign.active,
          });
          setRequestFailure("");
        }
      } catch (reason) {
        if (active) {
          setRequestFailure(requestError(reason));
        }
      } finally {
        if (active) {
          setIsLoadingCampaign(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [props.campaignId, props.mode, reset]);

  const onSubmit = async (values: CampaignEditValues) => {
    setRequestFailure("");

    try {
      if (props.mode === "edit") {
        await updateCampaign(props.campaignId, {
          name: values.name,
          hashtag: values.hashtag,
          terms_text: values.terms_text.trim(),
          active: values.active,
        });
      } else {
        await createCampaign(toCreateBody(values));
      }
      router.replace("/campaigns");
    } catch (reason) {
      setRequestFailure(requestError(reason));
    }
  };

  const heading = isEdit ? "Editar Campanha" : "Nova Campanha";
  const header = (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <Link className="text-primary underline" href="/campaigns">
        Voltar às campanhas
      </Link>
    </div>
  );

  if (isLoadingCampaign) {
    return (
      <>
        {header}
        <p>Carregando campanha...</p>
      </>
    );
  }

  return (
    <>
      {header}
      <form className="max-w-lg space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <Label htmlFor="campaign-name">Nome</Label>
        <Input
          aria-describedby={errors.name ? "campaign-name-error" : undefined}
          aria-invalid={Boolean(errors.name)}
          id="campaign-name"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive" id="campaign-name-error" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="campaign-hashtag">Hashtag</Label>
        <Input
          aria-describedby={errors.hashtag ? "campaign-hashtag-error" : undefined}
          aria-invalid={Boolean(errors.hashtag)}
          id="campaign-hashtag"
          {...register("hashtag")}
        />
        {errors.hashtag ? (
          <p className="text-sm text-destructive" id="campaign-hashtag-error" role="alert">
            {errors.hashtag.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="campaign-terms">Termos (opcional)</Label>
        <Textarea id="campaign-terms" {...register("terms_text")} />
      </div>
      {isEdit ? (
        <div className="flex items-center gap-2">
          <input
            className="size-4 rounded border border-input"
            id="campaign-active"
            type="checkbox"
            {...register("active")}
          />
          <Label htmlFor="campaign-active">Ativa</Label>
        </div>
      ) : null}
      {requestFailure ? (
        <p className="text-sm text-destructive" role="alert">
          {requestFailure}
        </p>
      ) : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Enviando..." : "Salvar"}
      </Button>
    </form>
    </>
  );
}
