"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("player");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 500));

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (users.find((u: any) => u.email === email)) {
      setError("Пользователь с таким email уже существует");
      setLoading(false);
      return;
    }

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

    // Переносим гостевые результаты, если есть
    const guestResults = localStorage.getItem("guestTestResults");
    if (guestResults) {
      const existing = JSON.parse(localStorage.getItem("testResults_" + newUser.id) || "[]");
      const parsed = JSON.parse(guestResults);
      existing.push(...parsed);
      localStorage.setItem("testResults_" + newUser.id, JSON.stringify(existing));
      localStorage.removeItem("guestTestResults");
    }

    const guestSessions = localStorage.getItem("gameSessions_guest");
    if (guestSessions) {
      localStorage.setItem("gameSessions_" + newUser.id, guestSessions);
      localStorage.removeItem("gameSessions_guest");
    }

    window.dispatchEvent(new Event("auth-change"));
    router.push("/test");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Регистрация</h1>
          <p className="text-muted-foreground">
            Создайте аккаунт и начните свой путь
          </p>
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
            {loading ? "Загрузка..." : "Зарегистрироваться"}
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