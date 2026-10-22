import { CampaignForm } from "@/features/campaigns/CampaignForm";

// Not yet optimized for instant navigation: the shared sidebar reads usePathname(),
// which is request-time data on a fallback route.
export const instant = false;

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-6">
      <CampaignForm campaignId={id} mode="edit" />
    </main>
  );
}
