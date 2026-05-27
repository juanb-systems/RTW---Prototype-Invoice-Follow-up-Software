import { FlowBuilderPageClient } from "@/components/automations/builder/FlowBuilderPageClient";

export const dynamic = "force-dynamic";

export default async function FlowBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FlowBuilderPageClient id={id} />;
}
