import { CampaignForm } from "@/features/campaigns/CampaignForm";

export default function NewCampaignPage() {
  return (
    <main className="p-6">
      <CampaignForm mode="create" />
    </main>
  );
}
