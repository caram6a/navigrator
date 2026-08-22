// Сервис отправки кодов подтверждения через Resend.com
// API Key задаётся на Vercel через переменную окружения

const RESEND_API_KEY = typeof process !== "undefined" && process.env.NEXT_PUBLIC_RESEND_KEY 
  ? process.env.NEXT_PUBLIC_RESEND_KEY 
  : "";

// Исключения — могут создавать много аккаунтов без реальной почты

interface EmailParams {
  to_email: string;
  to_name: string;
  code: string;
  type: "registration" | "password_reset";
}

export async function sendVerificationCode(params: EmailParams): Promise<boolean> {
  // Пробуем отправить через Resend
  if (RESEND_API_KEY) {
    try {
      const typeLabel = params.type === "registration" ? "Регистрация" : "Восстановление пароля";
      
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "НавИГРАтор <onboarding@resend.dev>",
          to: params.to_email,
          subject: `Код подтверждения — НавИГРАтор`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">НавИГРАтор</h1>
                <p style="color: #6b7280; margin: 4px 0 0;">Платформа развития навыков</p>
              </div>
              <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 16px; color: #374151;">Здравствуйте, <strong>${params.to_name}</strong>!</p>
                <p style="margin: 0 0 16px; color: #374151;">Ваш код для <strong>${typeLabel}</strong>:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <div style="display: inline-block; background: #f3f4f6; padding: 16px 32px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
                    ${params.code}
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
      if (res.ok) return true;
    } catch (err) {
      console.error("Resend error:", err);
    }
  }

  // Если Resend не сработал — регистрация невозможна
  // (кроме исключений — для них fallback в localStorage)
  if (isExceptionEmail(params.to_email)) {
    return simulateSendCode(params);
  }
  return false;
}

function simulateSendCode(params: EmailParams): boolean {
  const codes = JSON.parse(localStorage.getItem("verificationCodes") || "{}");
  codes[params.to_email] = {
    code: params.code,
    type: params.type,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  localStorage.setItem("verificationCodes", JSON.stringify(codes));
  
  console.log(`%c🔐 Код для ${params.to_email}: ${params.code}`, "font-size:16px; font-weight:bold; color:green;");
  
  return true;
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyCode(email: string, code: string): boolean {
  const codes = JSON.parse(localStorage.getItem("verificationCodes") || "{}");
  const data = codes[email];
  
  if (!data) return false;
  if (data.code !== code) return false;
  if (Date.now() > data.expiresAt) {
    delete codes[email];
    localStorage.setItem("verificationCodes", JSON.stringify(codes));
    return false;
  }
  
  delete codes[email];
  localStorage.setItem("verificationCodes", JSON.stringify(codes));
  return true;
}

export const EXCEPTION_EMAILS = ["kazak05ia@gmail.com", "bakes777@yandex.ru"];

export function isExceptionEmail(email: string): boolean {
  return EXCEPTION_EMAILS.includes(email.toLowerCase());
}