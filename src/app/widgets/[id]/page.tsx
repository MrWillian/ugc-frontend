import { WidgetDetail } from "@/features/widgets/WidgetDetail";

export default async function WidgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-6">
      <WidgetDetail widgetId={id} />
    </main>
  );
}
