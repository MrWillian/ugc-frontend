"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { AuthForm } from "./AuthForm";

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Email ou senha incorretos. Verifique e tente novamente.";
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [requestFailure, setRequestFailure] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="space-y-2">
        <Label htmlFor="login-email">E-mail</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="email"
            aria-describedby={errors.email ? "login-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            className="h-11 w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3"
            id="login-email"
            placeholder="seu@email.com"
            type="email"
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p className="text-sm text-destructive" id="login-email-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="current-password"
            aria-describedby={errors.password ? "login-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            className="h-11 w-full rounded-lg border border-input bg-background py-2 pl-10 pr-10"
            id="login-password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
          />
          <button
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-sm text-destructive" id="login-password-error" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end text-sm">
        <Link className="text-primary hover:underline" href="#">
          Esqueceu sua senha?
        </Link>
      </div>
    </AuthForm>
  );
}
