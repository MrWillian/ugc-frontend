import { WidgetForm } from "@/features/widgets/WidgetForm";

export default function NewWidgetPage() {
  return (
    <main className="p-6">
      <WidgetForm mode="create" />
    </main>
  );
}
