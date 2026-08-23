"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Star, Gamepad2, TrendingUp, Search, Loader2, MessageCircle } from "lucide-react";
import { GAMES } from "@/lib/games-data";

export default function HelpersPage() {
  const router = useRouter();
  const [helpers, setHelpers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const verifiedHelpers = users.filter((u: any) => u.role === "helper" && u.is_verified);
    setHelpers(verifiedHelpers);
    setLoading(false);

    const userData = localStorage.getItem("currentUser");
    if (userData) { try { setCurrentUser(JSON.parse(userData)); } catch {} }

    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");
    if (gameId) setSelectedGame(parseInt(gameId));
  }, []);

  // Рейтинг помощника
  const getHelperRating = (helperId: string) => {
    const sessions = JSON.parse(localStorage.getItem("gameSessions_" + helperId) || "[]");
    if (sessions.length === 0) return null;
    const completed = sessions.filter((s: any) => s.status === "completed");
    if (completed.length === 0) return null;
    return Math.min(5, Math.round((completed.length / sessions.length) * 5));
  };

  // Уникальные ученики помощника
  const getHelperStudents = (helperId: string) => {
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const studentIds = new Set<string>();
    allUsers.forEach((u: any) => {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      const hasHelper = sessions.some((s: any) => s.helperId === helperId);
      if (hasHelper) studentIds.add(u.id);
    });
    return studentIds.size;
  };

  // Игры которые вёл помощник (из сессий игроков)
  const getHelperGames = (helperId: string) => {
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const gameIds = new Set<number>();
    allUsers.forEach((u: any) => {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      sessions.filter((s: any) => s.helperId === helperId).forEach((s: any) => {
        if (s.gameId) gameIds.add(s.gameId);
      });
    });
    return GAMES.filter(g => gameIds.has(g.id));
  };

  // Есть ли активный чат у текущего пользователя с этим помощником
  const getActiveChatId = (helperId: string) => {
    if (!currentUser) return null;
    const sessions = JSON.parse(localStorage.getItem("gameSessions_" + currentUser.id) || "[]");
    const active = sessions.find((s: any) => s.helperId === helperId && s.status === "pending");
    return active?.id || null;
  };

  const filteredHelpers = helpers.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Выбор помощника</h1>
          <p className="text-muted-foreground">
            {selectedGame
              ? `Найдите наставника для игры "${GAMES.find(g => g.id === selectedGame)?.title}"`
              : "Найдите наставника для развития навыков"}
          </p>
        </div>

        {/* Поиск */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
          />
        </div>

        {filteredHelpers.length === 0 ? (
          <div className="text-center p-12 rounded-xl border bg-card">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Нет доступных помощников</h2>
            <p className="text-muted-foreground">Помощники появятся после одобрения администратором</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredHelpers.map((helper) => {
              const rating = getHelperRating(helper.id);
              const students = getHelperStudents(helper.id);
              const games = getHelperGames(helper.id);
              const activeChatId = getActiveChatId(helper.id);
              return (
                <div key={helper.id} className="p-6 rounded-xl border bg-card hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{helper.name}</h3>
                      <p className="text-sm text-muted-foreground">{helper.email}</p>
                    </div>
                    {rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{rating}/5</span>
                      </div>
                    )}
                  </div>

                  {helper.mbti_type && (
                    <div className="mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        {helper.mbti_type}
                      </span>
                    </div>
                  )}

                  {/* Статистика */}
                  <div className="flex gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{students} учеников</span>
                    </div>
                    {games.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                        <span>{games.length} игр</span>
                      </div>
                    )}
                  </div>

                  {/* Игры которые ведёт */}
                  {games.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Ведёт игры:</p>
                      <div className="flex flex-wrap gap-1">
                        {games.map(g => (
                          <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/5 text-primary">
                            {g.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeChatId ? (
                    <Button className="w-full" variant="secondary" onClick={() => router.push("/chat/" + activeChatId)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Перейти в чат
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => router.push(`/helper/${helper.id}${selectedGame ? `?game=${selectedGame}` : ""}`)}>
                      Выбрать наставника
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}