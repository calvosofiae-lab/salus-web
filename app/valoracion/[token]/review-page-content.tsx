import { ReviewForm } from "@/features/reviews/components/ReviewForm";

export async function ReviewPageContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="max-w-md mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Calificá tu turno</h1>
      <ReviewForm token={token} />
    </div>
  );
}
