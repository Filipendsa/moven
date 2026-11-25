import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PublicFormClient from "@/components/forms/PublicFormClient";

async function FormLoader({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  return <PublicFormClient slug={slug} />;
}

export default function PublicFormPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8fa66a]" />
        </div>
      }
    >
      <FormLoader params={params} />
    </Suspense>
  );
}
