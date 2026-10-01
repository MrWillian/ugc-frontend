import { Check } from "lucide-react";
import { SocialProofLogo } from "@/components/brand/SocialProofLogo";

export function AuthMarketingPanel({
  headline,
  subline,
  bullets,
}: {
  headline: string;
  subline: string;
  bullets?: string[];
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-brand-header p-8 text-white lg:p-12">
      <div className="relative z-10">
        <SocialProofLogo href="/" variant="light" />
        <h1 className="mt-10 max-w-md text-3xl font-bold leading-tight lg:text-4xl">
          {headline}
        </h1>
        <p className="mt-4 max-w-md text-base text-white/90">{subline}</p>
        {bullets && bullets.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {bullets.map((item) => (
              <li className="flex items-start gap-3 text-sm text-white/95" key={item}>
                <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="relative z-10 mt-12 text-sm text-white/70">
        Mais de 300 marcas já usam o SocialProof
      </p>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
