"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { seedUsers } from "@/lib/seed";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => { seedUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 500));

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      setError("Неверный email или пароль");
      setLoading(false);
      return;
    }

    localStorage.setItem("token", user.id);
    localStorage.setItem("currentUser", JSON.stringify(user));

    // Переносим гостевые результаты, если есть
    const guestResults = localStorage.getItem("guestTestResults");
    if (guestResults) {
      const existing = JSON.parse(localStorage.getItem("testResults_" + user.id) || "[]");
      const parsed = JSON.parse(guestResults);
      existing.push(...parsed);
      localStorage.setItem("testResults_" + user.id, JSON.stringify(existing));
      localStorage.removeItem("guestTestResults");
    }

    // Переносим гостевые игровые сессии
    const guestSessions = localStorage.getItem("gameSessions_guest");
    if (guestSessions) {
      localStorage.setItem("gameSessions_" + user.id, guestSessions);
      localStorage.removeItem("gameSessions_guest");
    }

    window.dispatchEvent(new Event("auth-change"));
    router.push("/profile");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Вход</h1>
          <p className="text-muted-foreground">
            Войдите в свой аккаунт
          </p>
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
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Загрузка..." : "Войти"}
          </Button>
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