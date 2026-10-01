import { PageHeader } from "@/components/patterns/PageHeader";
import { SettingsSections } from "@/features/settings/SettingsSections";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Perfil, integrações e aparência da sua conta."
        title="Configurações"
      />
      <SettingsSections />
    </>
  );
}
