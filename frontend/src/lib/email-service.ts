// Сервис отправки кодов подтверждения
// Использует API route /api/send-code для отправки через Resend

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
  // Пробуем отправить через свой API
  try {
    const res = await fetch("/api/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (res.ok) return true;
  } catch (err) {
    console.error("Send error:", err);
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