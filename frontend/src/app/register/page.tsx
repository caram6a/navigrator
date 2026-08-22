"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, KeyRound, User, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { sendVerificationCode, generateCode, verifyCode, isExceptionEmail } from "@/lib/email-service";

type Step = "form" | "verify";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("player");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sentCode, setSentCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (name.length < 2) {
      setError("Имя должно быть минимум 2 символа");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    // Проверка на существующий email (кроме исключений)
    if (users.find((u: any) => u.email === email) && !isExceptionEmail(email)) {
      setError("Пользователь с таким email уже существует");
      return;
    }

    setLoading(true);

    // Генерируем и отправляем код
    const newCode = generateCode();
    setSentCode(newCode);

    setLoading(false);

    // TODO: Вернуть подтверждение по коду после настройки EmailJS
    // Пока пропускаем верификацию — сразу создаём пользователя
    const usersList = JSON.parse(localStorage.getItem("users") || "[]");
    const isFirst = usersList.length === 0;

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: isFirst ? "admin" : role,
      is_verified: isFirst ? true : (role === "player" ? true : false),
      mbti_type: null,
      created_at: new Date().toISOString(),
    };

    usersList.push(newUser);
    localStorage.setItem("users", JSON.stringify(usersList));
    localStorage.setItem("token", newUser.id);
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    // Переносим гостевые данные
    const guestResults = localStorage.getItem("guestTestResults");
    if (guestResults) {
      const existing = JSON.parse(localStorage.getItem("testResults_" + newUser.id) || "[]");
      existing.push(...JSON.parse(guestResults));
      localStorage.setItem("testResults_" + newUser.id, JSON.stringify(existing));
      localStorage.removeItem("guestTestResults");
    }

    const guestSessions = localStorage.getItem("gameSessions_guest");
    if (guestSessions) {
      localStorage.setItem("gameSessions_" + newUser.id, guestSessions);
      localStorage.removeItem("gameSessions_guest");
    }

    window.dispatchEvent(new Event("auth-change"));
    setSuccess(true);

    setTimeout(() => router.push("/test"), 1500);
    return;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const newCode = generateCode();
    setSentCode(newCode);
    await sendVerificationCode({
      to_email: email,
      to_name: name,
      code: newCode,
      type: "registration",
    });
    startResendTimer();
  };

  const handleVerify = () => {
    setError("");
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Введите полный код из 6 цифр");
      return;
    }

    // Проверяем код
    let isValid = false;
    
    // Для исключений - любой код или код из localStorage
    if (isExceptionEmail(email)) {
      const stored = JSON.parse(localStorage.getItem("verificationCodes") || "{}");
      const data = stored[email];
      isValid = data && data.code === fullCode && Date.now() < data.expiresAt;
      if (!isValid) isValid = true; // Исключения могут пропускать верификацию
    } else {
      isValid = verifyCode(email, fullCode);
    }

    if (!isValid) {
      setError("Неверный код. Попробуйте снова.");
      return;
    }

    // Создаём пользователя
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const isFirst = users.length === 0;

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role: isFirst ? "admin" : role,
        is_verified: isFirst ? true : (role === "player" ? true : false),
        mbti_type: null,
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("token", newUser.id);
      localStorage.setItem("currentUser", JSON.stringify(newUser));

      // Переносим гостевые данные
      const guestResults = localStorage.getItem("guestTestResults");
      if (guestResults) {
        const existing = JSON.parse(localStorage.getItem("testResults_" + newUser.id) || "[]");
        existing.push(...JSON.parse(guestResults));
        localStorage.setItem("testResults_" + newUser.id, JSON.stringify(existing));
        localStorage.removeItem("guestTestResults");
      }

      const guestSessions = localStorage.getItem("gameSessions_guest");
      if (guestSessions) {
        localStorage.setItem("gameSessions_" + newUser.id, guestSessions);
        localStorage.removeItem("gameSessions_guest");
      }

      window.dispatchEvent(new Event("auth-change"));
      setSuccess(true);
      setLoading(false);

      setTimeout(() => router.push("/test"), 1500);
    }, 500);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Авто-переход к следующему полю
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  // Экран успеха
  if (success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Регистрация завершена!</h1>
          <p className="text-muted-foreground">Перенаправляем на тестирование...</p>
        </div>
      </div>
    );
  }

  // Экран подтверждения кода
  if (step === "verify") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Подтвердите email</h1>
            <p className="text-muted-foreground">
              Мы отправили код на <strong>{email}</strong>
              {isExceptionEmail(email) && (
                <span className="block text-xs text-amber-500 mt-1">
                  (Код отображается в консоли браузера: F12 → Console)
                </span>
              )}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-center mb-4">
                Введите 6-значный код
              </label>
              <div className="flex gap-2 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={loading || code.join("").length !== 6}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Подтвердить
            </Button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Отправить повторно через {resendTimer} сек
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm text-primary hover:underline"
                >
                  Отправить код повторно
                </button>
              )}
            </div>

            <button
              onClick={() => { setStep("form"); setCode(["", "", "", "", "", ""]); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Назад к регистрации
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Форма регистрации
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <User className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Регистрация</h1>
          <p className="text-muted-foreground">Создайте аккаунт и начните свой путь</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background"
              required
              minLength={2}
              placeholder="Введите ваше имя"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background"
              required
              placeholder="example@mail.ru"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background"
              required
              minLength={6}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            >
              <option value="player">Игрок</option>
              <option value="helper">Помощник</option>
            </select>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}