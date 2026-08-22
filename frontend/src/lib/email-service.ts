// Сервис отправки кодов подтверждения через EmailJS API напрямую (fetch)
// Бесплатно 200 писем/месяц на любые почты

const EMAILJS_SERVICE_ID = "service_2ngyspj";
const EMAILJS_TEMPLATE_ID = "template_rgvd4fa";
const EMAILJS_PUBLIC_KEY = "PaTPepj7Vrt7jYGfr";

// Исключения — могут создавать много аккаунтов без реальной почты
export const EXCEPTION_EMAILS = ["kazak05ia@gmail.com", "bakes777@yandex.ru"];

export function isExceptionEmail(email: string): boolean {
  return EXCEPTION_EMAILS.includes(email.toLowerCase());
}

interface EmailParams {
  to_email: string;
  to_name: string;
  code: string;
  type: "registration" | "password_reset";
}

export async function sendVerificationCode(params: EmailParams): Promise<boolean> {
  // Отправляем напрямую через EmailJS API (fetch, без SDK)
  try {
    const typeLabel = params.type === "registration" ? "Регистрация" : "Восстановление пароля";

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: params.to_email,
          to_name: params.to_name,
          code: params.code,
          type: typeLabel,
        },
      }),
    });

    if (res.ok) {
      console.log(`✅ Письмо отправлено на ${params.to_email}`);
      return true;
    }

    const text = await res.text();
    console.error("EmailJS error:", res.status, text);
  } catch (err) {
    console.error("EmailJS error:", err);
  }

  // Если отправка не сработала — регистрация невозможна
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