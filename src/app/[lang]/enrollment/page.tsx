import { Suspense } from "react";
import EnrollmentForm from "@/components/enrollment/EnrollmentForm";
import { Loader2 } from "lucide-react";

export default function EnrollmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8fa66a]" />
        </div>
      }
    >
      <EnrollmentForm />
    </Suspense>
  );
}
