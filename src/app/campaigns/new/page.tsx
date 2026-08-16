import { CampaignForm } from "@/features/campaigns/CampaignForm";

export default function NewCampaignPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Nova Campanha</h1>
      <CampaignForm mode="create" />
    </main>
  );
}
