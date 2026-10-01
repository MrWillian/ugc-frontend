"use client";

import type { FormEventHandler, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  children: ReactNode;
  error?: string;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  submitDisabled?: boolean;
}

export function AuthForm({
  children,
  error,
  isSubmitting,
  onSubmit,
  submitLabel,
  submitDisabled = false,
}: AuthFormProps) {
  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      {children}
      {error ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <Button
        className="h-11 w-full text-base"
        disabled={isSubmitting || submitDisabled}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {submitLabel.replace(/\.{3}$/, "")}…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
