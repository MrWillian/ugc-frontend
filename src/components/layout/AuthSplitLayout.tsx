import type { ReactNode } from "react";
import { AuthMarketingPanel } from "./AuthMarketingPanel";

export function AuthSplitLayout({
  headline,
  subline,
  bullets,
  children,
}: {
  headline: string;
  subline: string;
  bullets?: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <AuthMarketingPanel
        bullets={bullets}
        headline={headline}
        subline={subline}
      />
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-6 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
