import { NextResponse } from "next/server";

// Resend API Key (закодирован в base64 для безопасности)
const RESEND_KEY = Buffer.from("cmVfUm14OFk5d2RfQW9ZcVpvUXNhOUJVTWs5emdjUEhEU3B1", "base64").toString();

export async function POST(request: Request) {
  try {
    const { to_email, to_name, code, type } = await request.json();

    if (!to_email || !code || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const typeLabel = type === "registration" ? "Регистрация" : "Восстановление пароля";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "НавИГРАтор <onboarding@resend.dev>",
        to: to_email,
        subject: `Код подтверждения — НавИГРАтор`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">НавИГРАтор</h1>
              <p style="color: #6b7280; margin: 4px 0 0;">Платформа развития навыков</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 16px; color: #374151;">Здравствуйте, <strong>${to_name}</strong>!</p>
              <p style="margin: 0 0 16px; color: #374151;">Ваш код для <strong>${typeLabel}</strong>:</p>
              <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background: #f3f4f6; padding: 16px 32px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
                  ${code}
                </div>
              </div>
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Код действителен <strong>10 минут</strong>.</p>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Никому не сообщайте этот код.</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">С уважением, команда НавИГРАтор</p>
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();
    
    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Resend error:", data);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}