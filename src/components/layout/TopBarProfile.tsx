import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { getSessionUser } from "@/lib/session";

export function TopBarProfileSkeleton() {
  return (
    <div className="flex items-center gap-2 py-1 pl-1 pr-2" aria-hidden>
      <span className="size-8 animate-pulse rounded-full bg-muted" />
      <span className="hidden h-4 w-24 animate-pulse rounded bg-muted sm:block" />
    </div>
  );
}

export async function TopBarProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  return <ProfileMenu email={user.email} name={user.name} />;
}
