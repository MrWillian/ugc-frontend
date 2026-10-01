"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { signupSchema, type SignupValues } from "@/features/auth/schemas";
import { AuthForm } from "./AuthForm";

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [requestFailure, setRequestFailure] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch("password") ?? "";
  const checks = passwordChecks(passwordValue);
  const subdomainValue = watch("subdomain") ?? "";

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
      submitDisabled={!termsAccepted}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Criar conta grátis"
    >
      <div className="space-y-2">
        <Label htmlFor="signup-company">Nome da empresa</Label>
        <input
          autoComplete="organization"
          aria-describedby={errors.subdomain ? "signup-subdomain-error" : undefined}
          aria-invalid={Boolean(errors.subdomain)}
          className="h-11 w-full rounded-lg border border-input bg-background px-3"
          id="signup-company"
          placeholder="Ex: Loja da Maria"
          type="text"
          {...register("subdomain")}
        />
        {subdomainValue ? (
          <p className="text-xs text-muted-foreground">
            Seu endereço: {subdomainValue}.socialproof.app
          </p>
        ) : null}
        {errors.subdomain ? (
          <p className="text-sm text-destructive" id="signup-subdomain-error" role="alert">
            {errors.subdomain.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-name">Seu nome</Label>
        <input
          autoComplete="name"
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          aria-invalid={Boolean(errors.name)}
          className="h-11 w-full rounded-lg border border-input bg-background px-3"
          id="signup-name"
          placeholder="Ex: Maria Souza"
          type="text"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive" id="signup-name-error" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">E-mail corporativo</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="email"
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            className="h-11 w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3"
            id="signup-email"
            placeholder="seu@email.com"
            type="email"
            {...register("email")}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Recomendamos usar e-mail profissional.
        </p>
        {errors.email ? (
          <p className="text-sm text-destructive" id="signup-email-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <input
            autoComplete="new-password"
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-10"
            id="signup-password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
          />
          <button
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
        <ul className="space-y-1 text-xs">
          <li className={checks.length ? "text-status-success" : "text-muted-foreground"}>
            <Check aria-hidden className="mr-1 inline size-3" />
            8+ caracteres
          </li>
          <li className={checks.special ? "text-status-success" : "text-muted-foreground"}>
            <Check aria-hidden className="mr-1 inline size-3" />
            1 caractere especial
          </li>
        </ul>
        {errors.password ? (
          <p className="text-sm text-destructive" id="signup-password-error" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          checked={termsAccepted}
          className="mt-1 size-4 rounded border-input"
          type="checkbox"
          onChange={(e) => setTermsAccepted(e.target.checked)}
        />
        <span>
          Li e aceito os{" "}
          <a className="text-primary hover:underline" href="#">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a className="text-primary hover:underline" href="#">
            Política de Privacidade
          </a>
        </span>
      </label>
    </AuthForm>
  );
}
