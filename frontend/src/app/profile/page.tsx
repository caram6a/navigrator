"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Brain, TrendingUp, ClipboardCheck, Loader2, Gamepad2, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { seedUsers } from "@/lib/seed";
import { GAMES } from "@/lib/games-data";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [gameSessions, setGameSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const roleLabels: Record<string, string> = {
    admin: "Администратор",
    leader: "Лидер",
    helper: "Помощник",
    player: "Игрок",
  };

  useEffect(() => {
    seedUsers();
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find((u: any) => u.id === token);
    if (found) {
      setUser(found);
      localStorage.setItem("currentUser", JSON.stringify(found));
    }

    // Загружаем историю тестов
    const results = JSON.parse(localStorage.getItem("testResults_" + token) || "[]");
    setTestResults(results);

    // Загружаем игровые сессии
    const sessions = JSON.parse(localStorage.getItem("gameSessions_" + token) || "[]");
    setGameSessions(sessions);

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Вы не авторизованы</h2>
        <p className="text-muted-foreground mb-4">Войдите в аккаунт, чтобы увидеть профиль</p>
        <Button onClick={() => router.push("/login")}>Войти</Button>
      </div>
    );
  }

  const lastResult = testResults.length > 0 ? testResults[testResults.length - 1] : null;
  const prevResult = testResults.length > 1 ? testResults[testResults.length - 2] : null;

  // Считаем дельту
  const getDelta = (key: string) => {
    if (!lastResult || !prevResult) return null;
    const last = lastResult.dimensions[key]?.score || 0;
    const prev = prevResult.dimensions[key]?.score || 0;
    return last - prev;
  };

  const getAverageDelta = () => {
    if (!lastResult || !prevResult) return null;
    return Math.round((lastResult.average - prevResult.average) * 10) / 10;
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getGameTitle = (id: number) => {
    const game = GAMES.find(g => g.id === id);
    return game?.title || "Неизвестная игра";
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Карточка пользователя */}
        <div className="p-6 rounded-xl border bg-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
              {roleLabels[user.role] || user.role}
            </span>
            {user.mbti_type && (
              <span className="px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                {user.mbti_type}
              </span>
            )}
            {!user.is_verified && user.role === "helper" && (
              <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                На проверке
              </span>
            )}
          </div>
        </div>

        {/* Последний результат */}
        {lastResult && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Последний результат</h2>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{lastResult.mbtiType}</p>
              <p className="text-lg mt-1">{lastResult.description.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Средний балл: <strong>{lastResult.average}/7</strong>
                {getAverageDelta() !== null && (
                  <span className={getAverageDelta()! >= 0 ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
                    ({getAverageDelta()! >= 0 ? "+" : ""}{getAverageDelta()})
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(lastResult.date)}</p>
            </div>

            {/* Дельта по шкалам */}
            {prevResult && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-muted-foreground">Изменения с предыдущего теста:</p>
                {["EI", "SN", "TF", "JP"].map(key => {
                  const delta = getDelta(key);
                  if (delta === null) return null;
                  const names: Record<string, string> = {
                    EI: "Экстраверсия — Интроверсия",
                    SN: "Интуиция — Сенсорика",
                    TF: "Мышление — Чувство",
                    JP: "Суждение — Восприятие",
                  };
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span>{names[key]}</span>
                      <span className={delta >= 0 ? "text-green-500" : "text-red-500"}>
                        {delta >= 0 ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />}
                        {delta >= 0 ? "+" : ""}{delta}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {["EI", "SN", "TF", "JP"].map(key => {
                const dim = lastResult.dimensions[key];
                if (!dim) return null;
                let first = 0, second = 0, firstLabel = "", secondLabel = "";
                if (dim.E !== undefined) { first = dim.E; second = dim.I || 0; firstLabel = "E"; secondLabel = "I"; }
                else if (dim.S !== undefined) { first = dim.S; second = dim.N || 0; firstLabel = "S"; secondLabel = "N"; }
                else if (dim.T !== undefined) { first = dim.T; second = dim.F || 0; firstLabel = "T"; secondLabel = "F"; }
                else { first = dim.J || 0; second = dim.P || 0; firstLabel = "J"; secondLabel = "P"; }
                const scaleNames: Record<string, string> = {
                  EI: "Экстраверсия — Интроверсия",
                  SN: "Интуиция — Сенсорика",
                  TF: "Мышление — Чувство",
                  JP: "Суждение — Восприятие",
                };
                return (
                  <div key={key} className="p-4 rounded-xl border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">{scaleNames[key]}</div>
                    <div className="text-lg font-bold mb-2">{dim.value}: {dim.score}%</div>
                    <div className="flex justify-between text-sm">
                      <span>{firstLabel}: {first}%</span>
                      <span>{secondLabel}: {second}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/test")}>Пройти заново</Button>
            </div>
          </div>
        )}

        {/* История всех результатов */}
        {testResults.length > 1 && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">История тестов</h2>
            </div>
            <div className="space-y-3">
              {[...testResults].reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{r.mbtiType} — {r.description.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{r.average}/7</p>
                    <p className="text-xs text-muted-foreground">среднее</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Игровые сессии */}
        {gameSessions.length > 0 && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">Игровые сессии</h2>
            </div>
            <div className="space-y-3">
              {[...gameSessions].reverse().map((s, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">{formatDate(s.date)}</p>
                  {s.noGames ? (
                    <p className="text-sm text-muted-foreground">Не играл в игры</p>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(s.games).map(([gameId, data]: [string, any]) => (
                        <div key={gameId} className="flex items-center justify-between text-sm">
                          <span>{getGameTitle(parseInt(gameId))}</span>
                          <span className="text-muted-foreground">
                            {data.times} раз(а)
                            {data.helper ? ` | Наставник: Алексей Наставников` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Нет результатов */}
        {!lastResult && (
          <div className="text-center p-6 rounded-xl border bg-card">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Нет результатов теста</h2>
            <p className="text-muted-foreground mb-4">Пройдите MBTI-тест, чтобы узнать свой тип личности</p>
            <Button onClick={() => router.push("/test")}>Пройти тест</Button>
          </div>
        )}
      </div>
    </div>
  );
}