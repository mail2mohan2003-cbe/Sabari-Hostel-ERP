// Thin wrapper around Twilio for WhatsApp / SMS confirmations.
// If Twilio env vars are not set, calls are logged instead of sent so the
// app keeps working during local setup / testing.

type TwilioClient = {
  messages: { create: (opts: Record<string, string>) => Promise<unknown> };
};

let client: TwilioClient | null = null;

function getClient(): TwilioClient | null {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // Lazy require so the app doesn't fail to build/run if twilio isn't configured.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const twilio = require("twilio");
  client = twilio(sid, token);
  return client;
}

export async function sendWhatsApp(toPhone: string, body: string) {
  const c = getClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!c || !from) {
    console.log(`[whatsapp] Twilio not configured - skipping WhatsApp to ${toPhone}: ${body}`);
    return { sent: false };
  }
  await c.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${toPhone}`,
    body,
  });
  return { sent: true };
}

export async function sendSms(toPhone: string, body: string) {
  const c = getClient();
  const from = process.env.TWILIO_SMS_FROM;
  if (!c || !from) {
    console.log(`[sms] Twilio not configured - skipping SMS to ${toPhone}: ${body}`);
    return { sent: false };
  }
  await c.messages.create({ from, to: toPhone, body });
  return { sent: true };
}
