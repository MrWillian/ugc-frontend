import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  TopBarProfile,
  TopBarProfileSkeleton,
} from "@/components/layout/TopBarProfile";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      profile={
        <Suspense fallback={<TopBarProfileSkeleton />}>
          <TopBarProfile />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
