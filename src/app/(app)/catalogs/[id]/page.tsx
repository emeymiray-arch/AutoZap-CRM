import { redirect } from "next/navigation";

export default async function CatalogDetailRemoved({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/partners");
}
