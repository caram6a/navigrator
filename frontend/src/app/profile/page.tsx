"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Brain, TrendingUp, ClipboardCheck, Loader2, Gamepad2, Calendar, ArrowUp, ArrowDown, MessageCircle, HelpCircle, Shapes, Eye } from "lucide-react";
import { GAMES } from "@/lib/games-data";
import { FIGURES } from "@/lib/psychogeometry";

const MBTI_TOOLTIPS: Record<string, Record<string, string>> = {
  E: { label: "Экстраверсия", desc: "Ориентация на внешний мир, общение с людьми, активность в группе" },
  I: { label: "Интроверсия", desc: "Ориентация на внутренний мир, размышления, предпочтение уединения" },
  S: { label: "Сенсорика", desc: "Внимание к деталям, фактам, практическому опыту, конкретике" },
  N: { label: "Интуиция", desc: "Внимание к общим идеям, абстракциям, возможностям, будущему" },
  T: { label: "Мышление", desc: "Принятие решений на основе логики, анализа и объективных критериев" },
  F: { label: "Чувство", desc: "Принятие решений на основе ценностей, эмоций и гармонии" },
  J: { label: "Суждение", desc: "Предпочтение структуры, планов, организованности и определённости" },
  P: { label: "Восприятие", desc: "Предпочтение гибкости, спонтанности, открытости новому" },
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [psychologyResults, setPsychologyResults] = useState<any[]>([]);
  const [visualResults, setVisualResults] = useState<any[]>([]);
  const [gameSessions, setGameSessions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredScale, setHoveredScale] = useState<string | null>(null);

  const roleLabels: Record<string, string> = {
    admin: "Администратор",
    leader: "Лидер",
    helper: "Помощник",
    player: "Игрок",
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      setAllUsers(users);
      const found = users.find((u: any) => u.id === token);
      if (found) { setUser(found); localStorage.setItem("currentUser", JSON.stringify(found)); }
      const results = JSON.parse(localStorage.getItem("testResults_" + token) || "[]");
      setTestResults(results);
      const psycho = JSON.parse(localStorage.getItem("psychogeometryResults_" + token) || "[]");
      setPsychologyResults(psycho);
      const vis = JSON.parse(localStorage.getItem("visualTestResults_" + token) || "[]");
      setVisualResults(vis);
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + token) || "[]");
      setGameSessions(sessions);
      setLoading(false);
    } catch (err) {
      console.error("Profile load error:", err);
      setError("Ошибка загрузки профиля.");
      setLoading(false);
    }
  }, []);

  const getHelperName = (helperId: string) => {
    const h = allUsers.find((u: any) => u.id === helperId);
    return h?.name || "Наставник";
  };

  if (loading) return (<div className="container mx-auto px-4 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>);
  if (error) return (<div className="container mx-auto px-4 py-12 text-center"><h2 className="text-xl font-semibold text-destructive mb-2">Ошибка</h2><p className="text-muted-foreground mb-4">{error}</p></div>);
  if (!user) return (<div className="container mx-auto px-4 py-12 text-center"><User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" /><h2 className="text-xl font-semibold mb-2">Вы не авторизованы</h2><Button onClick={() => router.push("/login")}>Войти</Button></div>);

  const lastResult = testResults.length > 0 ? testResults[testResults.length - 1] : null;
  const prevResult = testResults.length > 1 ? testResults[testResults.length - 2] : null;
  const activeSessions = gameSessions.filter((s: any) => s.status === "pending" && s.helperId);
  const lastPsycho = psychologyResults.length > 0 ? psychologyResults[psychologyResults.length - 1] : null;
  const lastVisual = visualResults.length > 0 ? visualResults[visualResults.length - 1] : null;

  const getDelta = (key: string) => {
    if (!lastResult || !prevResult) return null;
    return (lastResult.dimensions?.[key]?.score || 0) - (prevResult.dimensions?.[key]?.score || 0);
  };
  const getAverageDelta = () => {
    if (!lastResult || !prevResult) return null;
    return Math.round((lastResult.average - prevResult.average) * 10) / 10;
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return d; }
  };

  const getGameTitle = (id: number) => GAMES.find(g => g.id === id)?.title || "Неизвестная игра";

  const scaleNames: Record<string, string> = {
    EI: "Экстраверсия — Интроверсия",
    SN: "Интуиция — Сенсорика",
    TF: "Мышление — Чувство",
    JP: "Суждение — Восприятие",
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
            <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">{roleLabels[user.role] || user.role}</span>
            {user.mbti_type && (
              <span className="px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">{user.mbti_type}</span>
            )}
            {!user.is_verified && user.role === "helper" && (
              <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">На проверке</span>
            )}
          </div>
        </div>

        {/* Активные сессии */}
        {activeSessions.length > 0 && (
          <div className="p-6 rounded-xl border bg-card border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">Активные сессии ({activeSessions.length})</h2>
            </div>
            <div className="space-y-3">
              {activeSessions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{getHelperName(s.helperId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.gameId ? getGameTitle(s.gameId) : "Без игры"} · {formatDate(s.date)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => router.push("/chat/" + s.id)}>
                    <MessageCircle className="h-4 w-4 mr-1" /> Чат
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Визуальный тест личности */}
        {lastVisual ? (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-semibold">Визуальный тест личности</h2>
            </div>
            <div className="p-6 rounded-xl border-2 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{lastVisual.profile}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">{lastVisual.description}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDate(lastVisual.date)}</span>
              <Button variant="outline" size="sm" onClick={() => router.push("/test/visual")}>Пройти заново</Button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-semibold">Визуальный тест личности</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">80 вопросов с фигурами по 10 шкалам личности.</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/test/visual")}>Пройти тест</Button>
          </div>
        )}

        {/* Психогеометрический тест */}
        {lastPsycho ? (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Shapes className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Психогеометрический тест</h2>
            </div>
            <div className={`p-6 rounded-xl border-2 ${lastPsycho.figure?.bgColor || "bg-card"}`}>
              <div className="flex items-center gap-4 mb-3">
                <span className={`text-5xl ${lastPsycho.figure?.color || "text-blue-500"}`}>
                  {lastPsycho.figure?.symbol || "○"}
                </span>
                <div>
                  <p className={`text-xl font-bold ${lastPsycho.figure?.color || "text-blue-500"}`}>
                    {lastPsycho.figure?.name || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">{lastPsycho.figure?.title || ""}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{lastPsycho.figure?.description}</p>
              {lastPsycho.figure?.mbtiCorrelation && (
                <p className="text-xs text-muted-foreground italic">Связь с MBTI: {lastPsycho.figure.mbtiCorrelation}</p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDate(lastPsycho.date)}</span>
              <Button variant="outline" size="sm" onClick={() => router.push("/test/psychogeometry")}>Пройти заново</Button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Shapes className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Психогеометрический тест</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Ещё не пройден. Узнай свой тип личности по геометрическим фигурам.</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/test/psychogeometry")}>Пройти тест</Button>
          </div>
        )}

        {/* MBTI Результаты */}
        {lastResult && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">MBTI — последний результат</h2>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{lastResult.mbtiType || "—"}</p>
              <p className="text-lg mt-1">{lastResult.description?.title || ""}</p>
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

            {prevResult && lastResult.dimensions && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-muted-foreground">Изменения с предыдущего теста:</p>
                {["EI", "SN", "TF", "JP"].map(key => {
                  const delta = getDelta(key);
                  if (delta === null) return null;
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span>{scaleNames[key]}</span>
                      <span className={delta >= 0 ? "text-green-500" : "text-red-500"}>
                        {delta >= 0 ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />}
                        {delta >= 0 ? "+" : ""}{delta}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {lastResult.dimensions && (
              <div className="grid grid-cols-2 gap-4">
                {["EI", "SN", "TF", "JP"].map(key => {
                  const dim = lastResult.dimensions[key];
                  if (!dim) return null;
                  let first = 0, second = 0, firstLabel = "", secondLabel = "";
                  if (dim.E !== undefined) { first = dim.E; second = dim.I || 0; firstLabel = "E"; secondLabel = "I"; }
                  else if (dim.S !== undefined) { first = dim.S; second = dim.N || 0; firstLabel = "S"; secondLabel = "N"; }
                  else if (dim.T !== undefined) { first = dim.T; second = dim.F || 0; firstLabel = "T"; secondLabel = "F"; }
                  else { first = dim.J || 0; second = dim.P || 0; firstLabel = "J"; secondLabel = "P"; }

                  return (
                    <div key={key} className="p-4 rounded-xl border bg-card relative">
                      <div className="text-xs text-muted-foreground mb-1">{scaleNames[key]}</div>
                      <div className="text-lg font-bold mb-2">{dim.value}: {dim.score}%</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 transition-colors cursor-help relative group"
                          onMouseEnter={() => setHoveredScale(firstLabel)}
                          onMouseLeave={() => setHoveredScale(null)}>
                          <span className="font-medium">{firstLabel}</span>
                          <span>{first}%</span>
                          {hoveredScale === firstLabel && MBTI_TOOLTIPS[firstLabel] && (
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-popover text-popover-foreground text-xs shadow-lg border max-w-[220px] text-center pointer-events-none">
                              <p className="font-medium mb-0.5">{MBTI_TOOLTIPS[firstLabel].label}</p>
                              <p className="text-muted-foreground">{MBTI_TOOLTIPS[firstLabel].desc}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 transition-colors cursor-help relative group"
                          onMouseEnter={() => setHoveredScale(secondLabel)}
                          onMouseLeave={() => setHoveredScale(null)}>
                          <span className="font-medium">{secondLabel}</span>
                          <span>{second}%</span>
                          {hoveredScale === secondLabel && MBTI_TOOLTIPS[secondLabel] && (
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-popover text-popover-foreground text-xs shadow-lg border max-w-[220px] text-center pointer-events-none">
                              <p className="font-medium mb-0.5">{MBTI_TOOLTIPS[secondLabel].label}</p>
                              <p className="text-muted-foreground">{MBTI_TOOLTIPS[secondLabel].desc}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/test/mbti")}>Пройти заново</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/tests")}>Все тесты</Button>
            </div>
          </div>
        )}

        {!lastResult && (
          <div className="text-center p-6 rounded-xl border bg-card">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Нет результатов MBTI</h2>
            <p className="text-muted-foreground mb-4">Пройдите MBTI-тест, чтобы узнать свой тип личности</p>
            <Button onClick={() => router.push("/test/mbti")}>Пройти MBTI-тест</Button>
          </div>
        )}

        {/* История тестов */}
        {testResults.length > 1 && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">История MBTI-тестов</h2>
            </div>
            <div className="space-y-3">
              {[...testResults].reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{r.mbtiType || "—"} — {r.description?.title || ""}</p>
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
              <h2 className="text-xl font-semibold">История сессий</h2>
            </div>
            <div className="space-y-3">
              {[...gameSessions].reverse().map((s, i) => {
                const isHelperSession = s.helperId !== undefined;
                return (
                  <div key={i} className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">{formatDate(s.date)}</p>
                    {!isHelperSession && s.noGames ? (
                      <p className="text-sm text-muted-foreground">Не играл в игры</p>
                    ) : !isHelperSession && s.games ? (
                      <div className="space-y-1">
                        {Object.entries(s.games).map(([gameId, data]: [string, any]) => (
                          <div key={gameId} className="flex items-center justify-between text-sm">
                            <span>{getGameTitle(parseInt(gameId))}</span>
                            <span className="text-muted-foreground">{data.times} раз(а){data.helper ? ` | Наставник: Алексей Наставников` : ""}</span>
                          </div>
                        ))}
                      </div>
                    ) : isHelperSession ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{getHelperName(s.helperId)}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.gameId ? getGameTitle(s.gameId) : "Без игры"}
                            {s.status === "completed" ? " · Завершена" : " · Активна"}
                          </p>
                        </div>
                        {s.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => router.push("/chat/" + s.id)}>
                            <MessageCircle className="h-3 w-3 mr-1" /> Чат
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Сессия</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
