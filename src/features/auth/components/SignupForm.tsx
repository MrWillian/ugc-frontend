"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signupSchema, type SignupValues } from "@/features/auth/schemas";
import { AuthForm } from "./AuthForm";

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

export function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [requestFailure, setRequestFailure] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async ({
    name,
    email,
    password,
    subdomain,
  }: SignupValues) => {
    setRequestFailure("");

    try {
      await signup(name, email, password, subdomain);
      router.replace("/dashboard");
    } catch (reason) {
      setRequestFailure(requestError(reason));
    }
  };

  return (
    <AuthForm
      error={requestFailure}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Criar conta"
    >
      <div className="space-y-1">
        <label htmlFor="signup-name">Nome</label>
        <input
          autoComplete="name"
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          aria-invalid={Boolean(errors.name)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          id="signup-name"
          type="text"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive" id="signup-name-error" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="signup-email">E-mail</label>
        <input
          autoComplete="email"
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          id="signup-email"
          type="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive" id="signup-email-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="signup-password">Senha</label>
        <input
          autoComplete="new-password"
          aria-describedby={errors.password ? "signup-password-error" : undefined}
          aria-invalid={Boolean(errors.password)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          id="signup-password"
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <p
            className="text-sm text-destructive"
            id="signup-password-error"
            role="alert"
          >
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="signup-subdomain">Subdomínio</label>
        <input
          autoComplete="off"
          aria-describedby={
            errors.subdomain ? "signup-subdomain-error" : undefined
          }
          aria-invalid={Boolean(errors.subdomain)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          id="signup-subdomain"
          type="text"
          {...register("subdomain")}
        />
        {errors.subdomain ? (
          <p
            className="text-sm text-destructive"
            id="signup-subdomain-error"
            role="alert"
          >
            {errors.subdomain.message}
          </p>
        ) : null}
      </div>
    </AuthForm>
  );
}
