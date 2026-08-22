import { NextResponse } from "next/server";

const EMAILJS_SERVICE_ID = "service_2ngyspj";
const EMAILJS_TEMPLATE_ID = "template_rgvd4fa";
const EMAILJS_PUBLIC_KEY = "PaTPepj7Vrt7jYGfr";

export async function POST(request: Request) {
  try {
    const { to_email, to_name, code, type } = await request.json();

    if (!to_email || !code || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const typeLabel = type === "registration" ? "Регистрация" : "Восстановление пароля";

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email,
          to_name,
          code,
          type: typeLabel,
        },
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    }

    const text = await res.text();
    console.error("EmailJS error:", res.status, text);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}