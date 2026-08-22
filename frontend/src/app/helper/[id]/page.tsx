"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Star, Gamepad2, Users, TrendingUp, Calendar, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { GAMES } from "@/lib/games-data";

export default function HelperProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [helper, setHelper] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find((u: any) => u.id === params.id);
    setHelper(found || null);

    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try { setCurrentUser(JSON.parse(userData)); } catch {}
    }

    const params2 = new URLSearchParams(window.location.search);
    const gameId = params2.get("game");
    if (gameId) setSelectedGame(parseInt(gameId));

    setLoading(false);
  }, [params.id]);

  // Рейтинг помощника
  const getHelperRating = () => {
    if (!helper) return null;
    const sessions = JSON.parse(localStorage.getItem("gameSessions_" + helper.id) || "[]");
    if (sessions.length === 0) return null;
    const completed = sessions.filter((s: any) => s.status === "completed");
    if (completed.length === 0) return null;
    return Math.min(5, Math.round((completed.length / sessions.length) * 5));
  };

  // Сколько учеников
  const getHelperStudents = () => {
    if (!helper) return 0;
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    let count = 0;
    allUsers.forEach((u: any) => {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      count += sessions.filter((s: any) => s.helperId === helper.id).length;
    });
    return count;
  };

  // Игры которые ведёт
  const getHelperGames = () => {
    if (!helper) return [];
    const sessions = JSON.parse(localStorage.getItem("gameSessions_" + helper.id) || "[]");
    const gameIds = new Set<number>();
    sessions.forEach((s: any) => {
      if (s.games) Object.keys(s.games).forEach((gid: string) => gameIds.add(parseInt(gid)));
    });
    return GAMES.filter(g => gameIds.has(g.id));
  };

  // Средний прогресс учеников
  const getAverageProgress = () => {
    if (!helper) return null;
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    let totalDelta = 0;
    let count = 0;
    allUsers.forEach((u: any) => {
      const results = JSON.parse(localStorage.getItem("testResults_" + u.id) || "[]");
      if (results.length >= 2) {
        const last = results[results.length - 1];
        const prev = results[results.length - 2];
        if (last && prev) {
          totalDelta += (last.average - prev.average);
          count++;
        }
      }
    });
    if (count === 0) return null;
    return Math.round((totalDelta / count) * 10) / 10;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!helper) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Помощник не найден</h2>
        <Button onClick={() => router.push("/helpers")}>К списку помощников</Button>
      </div>
    );
  }

  const rating = getHelperRating();
  const students = getHelperStudents();
  const games = getHelperGames();
  const avgProgress = getAverageProgress();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Карточка помощника */}
        <div className="p-6 rounded-xl border bg-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{helper.name}</h1>
              <p className="text-muted-foreground">{helper.email}</p>
            </div>
            {rating && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold">{rating}/5</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
              Помощник
            </span>
            {helper.mbti_type && (
              <span className="px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                {helper.mbti_type}
              </span>
            )}
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-xl border bg-card text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{students}</p>
              <p className="text-xs text-muted-foreground">учеников</p>
            </div>
            <div className="p-4 rounded-xl border bg-card text-center">
              <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{games.length}</p>
              <p className="text-xs text-muted-foreground">игр ведёт</p>
            </div>
            <div className="p-4 rounded-xl border bg-card text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{avgProgress !== null ? `+${avgProgress}` : "—"}</p>
              <p className="text-xs text-muted-foreground">средний рост</p>
            </div>
          </div>

          {/* Игры которые ведёт */}
          {games.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Ведёт игры:</h3>
              <div className="flex flex-wrap gap-2">
                {games.map(g => (
                  <span key={g.id} className="px-3 py-1 rounded-full text-sm bg-primary/5 text-primary border">
                    {g.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Создать сессию */}
        {currentUser && (
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4">Создать игровую сессию</h2>
            <p className="text-muted-foreground mb-4">
              {selectedGame
                ? `Начать игру "${GAMES.find(g => g.id === selectedGame)?.title}" с наставником ${helper.name}`
                : `Начать сессию с наставником ${helper.name}`}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const session = {
                    id: Date.now().toString(),
                    playerId: currentUser.id,
                    helperId: helper.id,
                    gameId: selectedGame,
                    status: "pending",
                    date: new Date().toISOString(),
                  };
                  const sessions = JSON.parse(localStorage.getItem("gameSessions_" + currentUser.id) || "[]");
                  sessions.push(session);
                  localStorage.setItem("gameSessions_" + currentUser.id, JSON.stringify(sessions));
                  router.push("/profile");
                }}
              >
                Начать сессию
              </Button>
              <Button variant="outline" onClick={() => router.push("/games")}>
                Выбрать другую игру
              </Button>
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="text-center p-6 rounded-xl border bg-card">
            <p className="text-muted-foreground mb-4">Войдите, чтобы создать сессию с наставником</p>
            <Button onClick={() => router.push("/login")}>Войти</Button>
          </div>
        )}
      </div>
    </div>
  );
}