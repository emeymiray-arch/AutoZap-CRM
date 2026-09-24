import { redirect } from "next/navigation";

export default async function CatalogEditRemoved({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/partners");
}
