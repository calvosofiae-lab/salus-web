import type { NextRequest } from "next/server";
import { sendAppointmentReminders } from "@/services/appointmentReminderService";

// Lo llama Vercel Cron una vez por día (vercel.json). Vercel manda el header
// "Authorization: Bearer <CRON_SECRET>" cuando la variable CRON_SECRET está definida en el
// proyecto. Sin este chequeo cualquiera podría disparar el envío de mails pegándole a la URL;
// la idempotencia de email_notifications evita duplicados, pero no que se adelante el envío.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sendAppointmentReminders();
  console.log("appointment-reminders:", JSON.stringify(result));
  return Response.json(result);
}
