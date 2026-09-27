import { WidgetForm } from "@/features/widgets/WidgetForm";

export default async function EditWidgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-6">
      <WidgetForm mode="edit" widgetId={id} />
    </main>
  );
}
