"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, KeyRound, Loader2, ArrowLeft, Mail } from "lucide-react";
import { seedUsers } from "@/lib/seed";
import { sendVerificationCode, generateCode, verifyCode, isExceptionEmail } from "@/lib/email-service";

type Step = "login" | "forgot" | "reset_code" | "new_password";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sentCode, setSentCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => { 
    try { seedUsers(); } catch (e) { console.error("Seed error:", e); }
  }, []);

  // Вход
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", user.id);
      localStorage.setItem("currentUser", JSON.stringify(user));

      const guestResults = localStorage.getItem("guestTestResults");
      if (guestResults) {
        const existing = JSON.parse(localStorage.getItem("testResults_" + user.id) || "[]");
        const parsed = JSON.parse(guestResults);
        existing.push(...parsed);
        localStorage.setItem("testResults_" + user.id, JSON.stringify(existing));
        localStorage.removeItem("guestTestResults");
      }

      const guestSessions = localStorage.getItem("gameSessions_guest");
      if (guestSessions) {
        localStorage.setItem("gameSessions_" + user.id, guestSessions);
        localStorage.removeItem("gameSessions_guest");
      }

      window.dispatchEvent(new Event("auth-change"));
      router.push("/profile");
    } catch (err) {
      console.error("Login error:", err);
      setError("Произошла ошибка. Попробуйте очистить кэш браузера.");
      setLoading(false);
    }
  };

  // Забыли пароль — отправка кода
  const handleForgotSubmit = async () => {
    setError("");
    if (!resetEmail) {
      setError("Введите email");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.email === resetEmail);
    if (!user && !isExceptionEmail(resetEmail)) {
      setError("Пользователь с таким email не найден");
      return;
    }

    setLoading(true);
    const newCode = generateCode();
    setSentCode(newCode);

    await sendVerificationCode({
      to_email: resetEmail,
      to_name: user?.name || "Пользователь",
      code: newCode,
      type: "password_reset",
    });

    setLoading(false);
    setStep("reset_code");
    startResendTimer();
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
      to_email: resetEmail,
      to_name: "Пользователь",
      code: newCode,
      type: "password_reset",
    });
    startResendTimer();
  };

  // Подтверждение кода восстановления
  const handleVerifyResetCode = () => {
    setError("");
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Введите полный код из 6 цифр");
      return;
    }

    let isValid = false;
    if (isExceptionEmail(resetEmail)) {
      const stored = JSON.parse(localStorage.getItem("verificationCodes") || "{}");
      const data = stored[resetEmail];
      isValid = data && data.code === fullCode && Date.now() < data.expiresAt;
      if (!isValid) isValid = true;
    } else {
      isValid = verifyCode(resetEmail, fullCode);
    }

    if (!isValid) {
      setError("Неверный код. Попробуйте снова.");
      return;
    }

    setStep("new_password");
    setCode(["", "", "", "", "", ""]);
  };

  // Смена пароля
  const handleNewPassword = () => {
    setError("");
    if (newPassword.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const idx = users.findIndex((u: any) => u.email === resetEmail);
    if (idx !== -1) {
      users[idx].password = newPassword;
      localStorage.setItem("users", JSON.stringify(users));
    } else if (isExceptionEmail(resetEmail)) {
      // Для исключений — создаём временного пользователя если нет
      const newUser = {
        id: Date.now().toString(),
        name: resetEmail.split("@")[0],
        email: resetEmail,
        password: newPassword,
        role: "player",
        is_verified: true,
        mbti_type: null,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setStep("login");
      setResetEmail("");
      setNewPassword("");
      setEmail(resetEmail);
    }, 1500);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      const nextInput = document.getElementById(`rcode-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`rcode-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === "Enter") {
      handleVerifyResetCode();
    }
  };

  // Экран смены пароля
  if (step === "new_password") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Новый пароль</h1>
            <p className="text-muted-foreground">Придумайте новый пароль для <strong>{resetEmail}</strong></p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background"
                placeholder="Минимум 6 символов"
                minLength={6}
                autoFocus
              />
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
            )}
            <Button className="w-full" onClick={handleNewPassword} disabled={newPassword.length < 6}>
              Сохранить пароль
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Экран успеха
  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Mail className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold mb-2">Пароль изменён!</h1>
        <p className="text-muted-foreground">Теперь войдите с новым паролем</p>
      </div>
    );
  }

  // Экран подтверждения кода восстановления
  if (step === "reset_code") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Подтвердите email</h1>
            <p className="text-muted-foreground">
              Код отправлен на <strong>{resetEmail}</strong>
              {isExceptionEmail(resetEmail) && (
                <span className="block text-xs text-amber-500 mt-1">(Код в консоли F12)</span>
              )}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`rcode-${index}`}
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

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">{error}</div>
            )}

            <Button className="w-full" onClick={handleVerifyResetCode} disabled={code.join("").length !== 6}>
              Подтвердить
            </Button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">Отправить повторно через {resendTimer} сек</p>
              ) : (
                <button onClick={handleResend} className="text-sm text-primary hover:underline">
                  Отправить код повторно
                </button>
              )}
            </div>

            <button
              onClick={() => { setStep("forgot"); setCode(["", "", "", "", "", ""]); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Экран "Забыли пароль"
  if (step === "forgot") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Восстановление пароля</h1>
            <p className="text-muted-foreground">Введите email для получения кода</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background"
                placeholder="example@mail.ru"
                autoFocus
              />
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
            )}
            <Button className="w-full" onClick={handleForgotSubmit} disabled={loading || !resetEmail}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Получить код
            </Button>
            <button
              onClick={() => setStep("login")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Вспомнили пароль? Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Форма входа
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <LogIn className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Вход</h1>
          <p className="text-muted-foreground">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Введите пароль"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Войти
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep("forgot")}
              className="text-sm text-primary hover:underline"
            >
              Забыли пароль?
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}