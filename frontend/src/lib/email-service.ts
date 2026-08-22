// EmailJS сервис для отправки кодов подтверждения
// 1. Зарегистрируйся на https://www.emailjs.com
// 2. Создай Email Service (Gmail, Yandex и т.д.)
// 3. Создай Email Template
// 4. Получи Service ID, Template ID, Public Key
// 5. Вставь их ниже

const EMAILJS_CONFIG = {
  serviceId: "service_navigrator",     // Заменить на свой Service ID
  templateId: "template_navigrator",   // Заменить на свой Template ID
  publicKey: "your_public_key",        // Заменить на свой Public Key
};

interface EmailParams {
  to_email: string;
  to_name: string;
  code: string;
  type: "registration" | "password_reset";
}

export async function sendVerificationCode(params: EmailParams): Promise<boolean> {
  // Если нет конфига — используем localStorage (для разработки)
  if (EMAILJS_CONFIG.publicKey === "your_public_key") {
    return simulateSendCode(params);
  }

  try {
    // Динамически загружаем EmailJS
    const emailjs = await import("@emailjs/browser");
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_email: params.to_email,
        to_name: params.to_name,
        code: params.code,
        type: params.type === "registration" ? "Регистрация" : "Смена пароля",
        message: `Ваш код подтверждения: ${params.code}. Никому не сообщайте этот код.`,
      },
      EMAILJS_CONFIG.publicKey
    );
    return true;
  } catch {
    // Если EmailJS не сработал — сохраняем в localStorage
    return simulateSendCode(params);
  }
}

function simulateSendCode(params: EmailParams): boolean {
  // Сохраняем код в localStorage (для теста без реальной почты)
  const codes = JSON.parse(localStorage.getItem("verificationCodes") || "{}");
  codes[params.to_email] = {
    code: params.code,
    type: params.type,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 минут
  };
  localStorage.setItem("verificationCodes", JSON.stringify(codes));
  
  // Для админских почт показываем код в консоли
  if (params.to_email === "kazak05ia@gmail.com" || params.to_email === "bakes777@yandex.ru") {
    console.log(`%c🔐 Код подтверждения для ${params.to_email}: ${params.code}`, "font-size:16px; font-weight:bold; color:green;");
  }
  
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
    return false; // Код истёк
  }
  
  // Удаляем использованный код
  delete codes[email];
  localStorage.setItem("verificationCodes", JSON.stringify(codes));
  return true;
}

// Исключения — могут создавать много аккаунтов
export const EXCEPTION_EMAILS = ["kazak05ia@gmail.com", "bakes777@yandex.ru"];

export function isExceptionEmail(email: string): boolean {
  return EXCEPTION_EMAILS.includes(email.toLowerCase());
}