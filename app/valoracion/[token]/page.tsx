import { Suspense } from "react";
import { ReviewPageContent } from "./review-page-content";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Cargando...</p>}>
      <ReviewPageContent params={params} />
    </Suspense>
  );
}
