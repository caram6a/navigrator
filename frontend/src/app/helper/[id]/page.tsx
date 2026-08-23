"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Star, Gamepad2, Users, TrendingUp, Calendar, ArrowUp, ArrowDown, Loader2, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { GAMES } from "@/lib/games-data";

export default function HelperProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [helper, setHelper] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

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

  // Ученики помощника (уникальные)
  const getHelperStudents = () => {
    if (!helper) return [];
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const studentIds = new Set<string>();
    const students: any[] = [];
    
    allUsers.forEach((u: any) => {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      const helperSessions = sessions.filter((s: any) => s.helperId === helper.id);
      if (helperSessions.length > 0 && !studentIds.has(u.id)) {
        studentIds.add(u.id);
        students.push({
          ...u,
          sessionCount: helperSessions.length,
          sessions: helperSessions,
        });
      }
    });
    
    return students;
  };

  // Сколько раз помощник вёл игры (сумма всех сессий)
  const getHelperGameCount = () => {
    if (!helper) return 0;
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    let count = 0;
    allUsers.forEach((u: any) => {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      count += sessions.filter((s: any) => s.helperId === helper.id).length;
    });
    return count;
  };

  // Игры которые вёл помощник (с количеством)
  const getHelperGamesWithCount = () => {
    if (!helper) return [];
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const gameCounts: Record<number, number> = {};
    
    allUsers.forEach((u: any) => {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      sessions.filter((s: any) => s.helperId === helper.id).forEach((s: any) => {
        if (s.gameId) {
          gameCounts[s.gameId] = (gameCounts[s.gameId] || 0) + 1;
        }
      });
    });
    
    return Object.entries(gameCounts).map(([id, count]) => ({
      game: GAMES.find(g => g.id === parseInt(id)),
      count,
    })).filter(item => item.game);
  };

  // Средний прогресс учеников (по среднему баллу)
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

  // Изменения по компетенциям для ученика
  const getStudentCompetencyChanges = (studentId: string) => {
    const results = JSON.parse(localStorage.getItem("testResults_" + studentId) || "[]");
    if (results.length < 2) return null;
    const last = results[results.length - 1];
    const prev = results[results.length - 2];
    if (!last || !prev || !last.dimensions || !prev.dimensions) return null;
    
    const changes: Record<string, number> = {};
    ["EI", "SN", "TF", "JP"].forEach(key => {
      const lastScore = last.dimensions[key]?.score || 0;
      const prevScore = prev.dimensions[key]?.score || 0;
      changes[key] = lastScore - prevScore;
    });
    return {
      averageDelta: Math.round((last.average - prev.average) * 10) / 10,
      changes,
      lastResult: last,
      prevResult: prev,
    };
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
  const gamesWithCount = getHelperGamesWithCount();
  const gameCount = getHelperGameCount();
  const avgProgress = getAverageProgress();

  const scaleNames: Record<string, string> = {
    EI: "Экстраверсия — Интроверсия",
    SN: "Интуиция — Сенсорика",
    TF: "Мышление — Чувство",
    JP: "Суждение — Восприятие",
  };

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
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-xs text-muted-foreground">учеников</p>
            </div>
            <div className="p-4 rounded-xl border bg-card text-center">
              <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{gameCount}</p>
              <p className="text-xs text-muted-foreground">сессий проведено</p>
            </div>
            <div className="p-4 rounded-xl border bg-card text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {avgProgress !== null 
                  ? (avgProgress >= 0 ? `+${avgProgress}` : `${avgProgress}`)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">средний рост</p>
            </div>
          </div>

          {/* Игры которые вёл */}
          {gamesWithCount.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Проведённые игры:</h3>
              <div className="flex flex-wrap gap-2">
                {gamesWithCount.map(({ game, count }) => (
                  <span key={game!.id} className="px-3 py-1 rounded-full text-sm bg-primary/5 text-primary border">
                    {game!.title} ×{count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Список учеников */}
        {students.length > 0 && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Ученики ({students.length})</h2>
            </div>
            <div className="space-y-3">
              {students.map((student) => {
                const compChanges = getStudentCompetencyChanges(student.id);
                const isExpanded = expandedStudent === student.id;
                return (
                  <div key={student.id} className="rounded-lg border overflow-hidden">
                    <button
                      onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 p-1.5 rounded-full bg-primary/10 text-primary" />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.sessionCount} сессий
                            {student.mbti_type ? ` | ${student.mbti_type}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {compChanges && (
                          <span className={`text-sm font-medium ${compChanges.averageDelta >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {compChanges.averageDelta >= 0 ? "+" : ""}{compChanges.averageDelta}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3">
                        {/* Сессии ученика с этим помощником */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Сессии:</p>
                          {student.sessions.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <span>
                                {s.gameId ? GAMES.find(g => g.id === s.gameId)?.title || "Без игры" : "Без игры"}
                              </span>
                              <span className="text-muted-foreground">
                                {s.date ? new Date(s.date).toLocaleDateString("ru-RU") : ""}
                                {" | "}
                                {s.status === "completed" ? "Завершена" : "Ожидает"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Изменения по компетенциям */}
                        {compChanges && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Изменения после последней игры:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(compChanges.changes).map(([key, delta]) => (
                                <div key={key} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                  <span className="text-xs">{scaleNames[key]}</span>
                                  <span className={`font-medium ${delta >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {delta >= 0 ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />}
                                    {delta >= 0 ? "+" : ""}{delta}%
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50 mt-1">
                              <span className="text-xs">Средний балл</span>
                              <span className={`font-medium ${compChanges.averageDelta >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {compChanges.averageDelta >= 0 ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />}
                                {compChanges.averageDelta >= 0 ? "+" : ""}{compChanges.averageDelta}
                              </span>
                            </div>
                          </div>
                        )}

                        {!compChanges && (
                          <p className="text-xs text-muted-foreground">Нет данных для сравнения (нужно минимум 2 теста)</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  // Проверяем, есть ли уже такая сессия
                  const sessions = JSON.parse(localStorage.getItem("gameSessions_" + currentUser.id) || "[]");
                  const exists = sessions.some(
                    (s: any) => s.helperId === helper.id && s.gameId === selectedGame && s.status === "pending"
                  );
                  
                  if (exists) {
                    router.push("/profile");
                    return;
                  }

                  const session = {
                    id: Date.now().toString(),
                    playerId: currentUser.id,
                    helperId: helper.id,
                    gameId: selectedGame,
                    status: "pending",
                    date: new Date().toISOString(),
                  };
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