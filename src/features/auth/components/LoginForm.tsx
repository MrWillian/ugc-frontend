"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { AuthForm } from "./AuthForm";

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [requestFailure, setRequestFailure] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }: LoginValues) => {
    setRequestFailure("");

    try {
      await login(email, password);
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
      submitLabel="Entrar"
    >
      <div className="space-y-1">
        <label htmlFor="login-email">E-mail</label>
        <input
          autoComplete="email"
          aria-describedby={errors.email ? "login-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          id="login-email"
          type="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive" id="login-email-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="login-password">Senha</label>
        <input
          autoComplete="current-password"
          aria-describedby={errors.password ? "login-password-error" : undefined}
          aria-invalid={Boolean(errors.password)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          id="login-password"
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive" id="login-password-error" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>
    </AuthForm>
  );
}
