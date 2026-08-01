"use client";

import type { FormEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  children: ReactNode;
  error?: string;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
}

export function AuthForm({
  children,
  error,
  isSubmitting,
  onSubmit,
  submitLabel,
}: AuthFormProps) {
  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Enviando..." : submitLabel}
      </Button>
    </form>
  );
}
