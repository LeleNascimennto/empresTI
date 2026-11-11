import { PlaceholderPage } from "@/components/placeholder-page";

export default async function EquipmentPage({
  params,
}: {
  params: Promise<{ patrimonio: string }>;
}) {
  const { patrimonio } = await params;
  return <PlaceholderPage title={`Equipamento ${patrimonio}`} />;
}
