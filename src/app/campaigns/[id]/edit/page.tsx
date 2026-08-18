import { CampaignForm } from "@/features/campaigns/CampaignForm";

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
