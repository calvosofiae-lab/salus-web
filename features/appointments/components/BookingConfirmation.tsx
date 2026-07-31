export function BookingConfirmation({
  professionalName,
  date,
  startTime,
}: {
  professionalName: string;
  date: string;
  startTime: string;
}) {
  return (
    <div className="rounded-md border border-green-600 bg-green-50 p-4 text-sm text-green-800">
      <p className="font-medium">¡Turno reservado!</p>
      <p>
        Con {professionalName} el {date} a las {startTime.slice(0, 5)} hs.
      </p>
    </div>
  );
}
