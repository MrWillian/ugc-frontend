"use client";

import { useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CopyEmbedField(props: {
  embedCode: string;
  id: string;
}): JSX.Element {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  async function copy() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(props.embedCode);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError("Não foi possível copiar o código.");
    }
  }

  return (
    <div className="flex min-w-[12rem] flex-col gap-2">
      <Textarea
        className="min-h-[4.5rem] font-mono text-xs"
        id={props.id}
        readOnly
        value={props.embedCode}
      />
      <Button onClick={() => void copy()} size="sm" type="button" variant="outline">
        {copied ? "Copiado" : "Copiar"}
      </Button>
      {copyError ? (
        <p className="text-sm text-destructive" role="alert">
          {copyError}
        </p>
      ) : null}
    </div>
  );
}
