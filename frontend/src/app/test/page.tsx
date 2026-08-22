"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft, CheckCircle } from "lucide-react";
import { QUESTIONS, MBTI_DESCRIPTIONS } from "@/lib/openjung";
import { GAMES } from "@/lib/games-data";

type DimensionData = {
  value: string;
  score: number;
  E?: number;
  I?: number;
  S?: number;
  N?: number;
  T?: number;
  F?: number;
  J?: number;
  P?: number;
};

interface TestResult {
  mbtiType: string;
  dimensions: {
    EI: DimensionData;
    SN: DimensionData;
    TF: DimensionData;
    JP: DimensionData;
  };
  description: {
    title: string;
    description: string;
    strengths: string[];
    growth: string[];
  };
  average: number;
  date: string;
}

function calculateMBTI(answers: Record<number, number>): TestResult {
  let e = 0, i = 0, s = 0, n = 0, t = 0, f = 0, j = 0, p = 0;
  let sum = 0;

  const processBlock = (ids: number[], left: () => void, right: () => void) => {
    ids.forEach(q => {
      const v = answers[q] || 0;
      sum += v;
      if (v <= 4) left();
      else right();
    });
  };

  processBlock([1, 2, 3, 4, 17, 18, 19, 20, 29, 30, 31, 32],
    () => { e += 4; }, () => { i += 4; }
  );
  processBlock([5, 6, 7, 8],
    () => { s += 4; }, () => { n += 4; }
  );
  processBlock([9, 10, 11, 12, 21, 22, 23, 24],
    () => { t += 4; }, () => { f += 4; }
  );
  processBlock([13, 14, 15, 16, 25, 26, 27, 28],
    () => { j += 4; }, () => { p += 4; }
  );

  const mbtiType = (e >= i ? "E" : "I") + (s >= n ? "S" : "N") + (t >= f ? "T" : "F") + (j >= p ? "J" : "P");

  const calcDim = (first: number, second: number, firstL: string, secondL: string) => {
    const total = first + second;
    const value = first >= second ? firstL : secondL;
    const pct = total === 0 ? 50 : Math.round(Math.max(first, second) / total * 100);
    return {
      value,
      score: pct,
      [firstL]: Math.round(first / (total || 1) * 100),
      [secondL]: Math.round(second / (total || 1) * 100),
    };
  };

  const desc = MBTI_DESCRIPTIONS[mbtiType] || MBTI_DESCRIPTIONS["INTJ"];

  return {
    mbtiType,
    dimensions: {
      EI: calcDim(e, i, "E", "I"),
      SN: calcDim(s, n, "S", "N"),
      TF: calcDim(t, f, "T", "F"),
      JP: calcDim(j, p, "J", "P"),
    },
    description: desc,
    average: Math.round(sum / 32 * 10) / 10,
    date: new Date().toISOString(),
  };
}

function saveResult(res: TestResult) {
  const token = localStorage.getItem("token");
  const key = token ? ("testResults_" + token) : "guestTestResults";

  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(res);
  localStorage.setItem(key, JSON.stringify(existing));

  if (token) {
    // Обновляем mbti_type у пользователя
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const idx = users.findIndex((u: any) => u.id === token);
    if (idx !== -1) {
      users[idx].mbti_type = res.mbtiType;
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify(users[idx]));
      window.dispatchEvent(new Event("auth-change"));
    }
  }
}

export default function TestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRetake, setIsRetake] = useState(false);
  const [gameSessionStep, setGameSessionStep] = useState(false);
  const [selectedGames, setSelectedGames] = useState<Record<number, { times: number; helper: string; rating: number }>>({});
  const [noGames, setNoGames] = useState(false);
  const router = useRouter();
  const divRef = useRef<HTMLDivElement>(null);

  // Определяем, повторный ли тест
  useEffect(() => {
    const token = localStorage.getItem("token");
    const key = token ? ("testResults_" + token) : "guestTestResults";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (existing.length > 0) setIsRetake(true);
  }, []);

  useEffect(() => {
    divRef.current?.focus();
  }, [currentQuestion]);

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion + 1]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== 32 || submitting) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    const res = calculateMBTI(answers);
    saveResult(res);

    // Если повторный тест — показываем блок про игры
    if (isRetake) {
      setResult(res);
      setGameSessionStep(true);
    } else {
      setResult(res);
    }
    setSubmitting(false);
  };

  const handleSaveGameSession = () => {
    // Сохраняем данные об играх
    const token = localStorage.getItem("token");
    const userId = token || "guest";
    const sessionData = {
      date: new Date().toISOString(),
      noGames,
      games: selectedGames,
    };
    const existing = JSON.parse(localStorage.getItem("gameSessions_" + userId) || "[]");
    existing.push(sessionData);
    localStorage.setItem("gameSessions_" + userId, JSON.stringify(existing));

    // Сохраняем/обновляем оценки игр (1 раз на игру, можно изменить)
    const ratings = JSON.parse(localStorage.getItem("gameRatings") || "{}");
    Object.entries(selectedGames).forEach(([gameId, data]) => {
      if (data.rating) {
        ratings[gameId] = ratings[gameId] || {};
        ratings[gameId][userId] = data.rating;
      }
    });
    localStorage.setItem("gameRatings", JSON.stringify(ratings));

    setGameSessionStep(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "1" && e.key <= "7") {
      e.preventDefault();
      handleAnswer(parseInt(e.key));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentQuestion < QUESTIONS.length - 1) nextQuestion();
      else if (Object.keys(answers).length === 32) handleSubmit();
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextQuestion();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      prevQuestion();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[currentQuestion + 1];
        return newAnswers;
      });
    }
  };

  const answeredCount = Object.keys(answers).length;
  const currentAnswer = answers[currentQuestion + 1] || 0;

  const renderDimension = (key: string, dim: DimensionData) => {
    let first = 0, second = 0, firstLabel = "", secondLabel = "";
    if (dim.E !== undefined) {
      first = dim.E; second = dim.I || 0;
      firstLabel = "E"; secondLabel = "I";
    } else if (dim.S !== undefined) {
      first = dim.S; second = dim.N || 0;
      firstLabel = "S"; secondLabel = "N";
    } else if (dim.T !== undefined) {
      first = dim.T; second = dim.F || 0;
      firstLabel = "T"; secondLabel = "F";
    } else {
      first = dim.J || 0; second = dim.P || 0;
      firstLabel = "J"; secondLabel = "P";
    }
    const scaleNames: Record<string, string> = {
      EI: "Экстраверсия — Интроверсия",
      SN: "Интуиция — Сенсорика",
      TF: "Мышление — Чувство",
      JP: "Суждение — Восприятие",
    };
    return (
      <div key={key} className="p-4 rounded-xl border bg-card">
        <div className="text-xs text-muted-foreground mb-1">{scaleNames[key] || key}</div>
        <div className="text-lg font-bold mb-2">{dim.value}: {dim.score}%</div>
        <div className="flex justify-between text-sm">
          <span>{firstLabel}: {first}%</span>
          <span>{secondLabel}: {second}%</span>
        </div>
      </div>
    );
  };

  // Экран выбора игр (после повторного теста)
  if (gameSessionStep && result) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Тест завершён!</h2>
            <p className="text-muted-foreground">Ваш тип: <strong>{result.mbtiType}</strong> | Среднее: <strong>{result.average}/7</strong></p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <h3 className="text-lg font-semibold mb-4">В какие игры ты играл?</h3>
            {noGames ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Вы отметили, что не играли в игры</p>
                <div className="flex gap-2">
                  <Button onClick={() => setNoGames(false)} variant="outline">Выбрать игры</Button>
                  <Button onClick={() => { handleSaveGameSession(); router.push("/profile"); }}>К профилю</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {GAMES.map(game => (
                  <div key={game.id} className="p-3 rounded-lg border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedGames[game.id]}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGames(prev => ({ ...prev, [game.id]: { times: 1, helper: "", rating: 0 } }));
                          } else {
                            const newSel = { ...selectedGames };
                            delete newSel[game.id];
                            setSelectedGames(newSel);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{game.title}</span>
                    </label>
                    {selectedGames[game.id] && (
                      <div className="mt-3 ml-7 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm w-32">Сколько раз:</label>
                          <input
                            type="number"
                            min={1}
                            value={selectedGames[game.id].times}
                            onChange={(e) => setSelectedGames(prev => ({
                              ...prev, [game.id]: { ...prev[game.id], times: parseInt(e.target.value) || 1 }
                            }))}
                            className="w-20 px-2 py-1 rounded border bg-background text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm w-32">Наставник:</label>
                          <select
                            value={selectedGames[game.id].helper}
                            onChange={(e) => setSelectedGames(prev => ({
                              ...prev, [game.id]: { ...prev[game.id], helper: e.target.value }
                            }))}
                            className="flex-1 px-2 py-1 rounded border bg-background text-sm"
                          >
                            <option value="">Не было</option>
                            <option value="helper_fake_1">Алексей Наставников</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm w-32">Оценка игры (1-10):</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={selectedGames[game.id].rating || ""}
                            onChange={(e) => setSelectedGames(prev => ({
                              ...prev, [game.id]: { ...prev[game.id], rating: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-20 px-2 py-1 rounded border bg-background text-sm text-center"
                            placeholder="1-10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setNoGames(true)} variant="outline">Не играл</Button>
                  <Button onClick={() => { handleSaveGameSession(); router.push("/profile"); }}>
                    Сохранить и перейти в профиль
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН РЕЗУЛЬТАТА
  if (result) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Тест завершён!</h1>
            <p className="text-muted-foreground">Ваш тип личности: {result.mbtiType}</p>
            <p className="text-sm text-muted-foreground">Средний балл: {result.average}/7</p>
          </div>

          <div className="p-6 rounded-xl border bg-card text-center">
            <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {result.description.title}
            </h2>
            <p className="text-muted-foreground">{result.description.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderDimension("EI", result.dimensions.EI)}
            {renderDimension("SN", result.dimensions.SN)}
            {renderDimension("TF", result.dimensions.TF)}
            {renderDimension("JP", result.dimensions.JP)}
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <h3 className="font-semibold text-lg mb-3">Сильные стороны</h3>
            <ul className="space-y-2">
              {result.description.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <h3 className="font-semibold text-lg mb-3">Зоны роста</h3>
            <ul className="space-y-2">
              {result.description.growth.map((g: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/profile")}>Мой профиль</Button>
            <Button onClick={() => router.push("/games")}>Выбрать игру</Button>
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН ТЕСТА
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <Brain className="h-8 w-8 inline mr-2 text-purple-500" />
            MBTI-тест
          </h1>
          {isRetake && (
            <p className="text-sm text-amber-600 dark:text-amber-400">Повторное прохождение</p>
          )}
        </div>

        <div
          ref={divRef}
          tabIndex={-1}
          style={{ outline: "none" }}
          onKeyDown={handleKeyDown}
        >
          {/* Кружочки вопросов */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            {QUESTIONS.map((q, i) => {
              const isAnswered = !!answers[i + 1];
              const isCurrent = i === currentQuestion;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestion(i)}
                  className={
                    "w-8 h-8 rounded-full text-xs font-medium transition-all " +
                    (isCurrent
                      ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30"
                      : isAnswered
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80")
                  }
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="h-2 bg-muted rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: (answeredCount / QUESTIONS.length) * 100 + "%" }} />
          </div>

          <div className="p-8 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-8 text-center">{QUESTIONS[currentQuestion]?.text}</h2>
            <div className="space-y-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{QUESTIONS[currentQuestion]?.left}</span>
                <span>{QUESTIONS[currentQuestion]?.right}</span>
              </div>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { handleAnswer(value); divRef.current?.focus(); }}
                    className={
                      "w-10 h-10 rounded-full text-sm font-medium transition-all " +
                      (currentAnswer === value
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground")
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Назад
            </Button>
            {currentQuestion < QUESTIONS.length - 1 ? (
              <Button onClick={nextQuestion} disabled={!currentAnswer}>
                Далее
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || answeredCount !== 32}>
                {submitting ? "Отправка..." : "Завершить тест"}
              </Button>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            1-7 — выбор, Enter — далее, ← → — навигация
          </p>
        </div>
      </div>
    </div>
  );
}