"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shapes, ArrowLeft, CheckCircle, Brain } from "lucide-react";
import { FIGURES, type PsychogeometryFigure } from "@/lib/psychogeometry";

interface PsychogeometryResult {
  figureId: string;
  figure: PsychogeometryFigure;
  date: string;
  secondChoice?: string;
}

function saveResult(res: PsychogeometryResult) {
  const token = localStorage.getItem("token");
  const key = token ? ("psychogeometryResults_" + token) : "guestPsychogeometryResults";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(res);
  localStorage.setItem(key, JSON.stringify(existing));
}

export default function PsychogeometryTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "second" | "result">("choose");
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [secondChoice, setSecondChoice] = useState<string | null>(null);
  const [result, setResult] = useState<PsychogeometryResult | null>(null);
  const [isRetake, setIsRetake] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const key = token ? ("psychogeometryResults_" + token) : "guestPsychogeometryResults";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (existing.length > 0) setIsRetake(true);
  }, []);

  const handleFirstChoice = (id: string) => {
    setFirstChoice(id);
    setStep("second");
  };

  const handleSecondChoice = (id: string) => {
    setSecondChoice(id);
    const figure = FIGURES.find(f => f.id === firstChoice);
    if (figure) {
      const res: PsychogeometryResult = {
        figureId: firstChoice!,
        figure,
        date: new Date().toISOString(),
        secondChoice: id,
      };
      saveResult(res);
      setResult(res);
      setStep("result");
    }
  };

  const selectedFigure = result?.figure;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Шаг 1: Выбор фигуры */}
        {step === "choose" && (
          <>
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.push("/tests")}><ArrowLeft className="h-4 w-4 mr-2" /> К тестам</Button>
            </div>
            <div className="text-center mb-8">
              <Shapes className="h-12 w-12 mx-auto mb-3 text-blue-500" />
              <h1 className="text-3xl font-bold mb-2">Психогеометрический тест</h1>
              <p className="text-muted-foreground">
                Посмотри на 5 фигур. Выбери ту, которая <strong>больше всего тебе подходит</strong>, олицетворяет тебя
              </p>
              {isRetake && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Повторное прохождение</p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-4 mb-8">
              {FIGURES.map((fig) => (
                <button
                  key={fig.id}
                  onClick={() => handleFirstChoice(fig.id)}
                  className="group p-4 rounded-xl border-2 border-border hover:border-blue-400 hover:shadow-lg transition-all text-center"
                >
                  <div className={`text-5xl mb-3 ${fig.color} group-hover:scale-110 transition-transform`}>
                    {fig.symbol}
                  </div>
                  <p className="text-sm font-medium">{fig.name}</p>
                </button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Не думай слишком долго — выбирай первую фигуру, которая привлекла внимание
              </p>
            </div>
          </>
        )}

        {/* Шаг 2: Второй выбор */}
        {step === "second" && (
          <>
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setStep("choose")}><ArrowLeft className="h-4 w-4 mr-2" /> Назад</Button>
            </div>
            <div className="text-center mb-8">
              <Shapes className="h-12 w-12 mx-auto mb-3 text-blue-500" />
              <h1 className="text-2xl font-bold mb-2">Второй выбор</h1>
              <p className="text-muted-foreground">
                А теперь выбери фигуру из <strong>оставшихся</strong>, которая тебе тоже близка
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {FIGURES.filter(f => f.id !== firstChoice).map((fig) => (
                <button
                  key={fig.id}
                  onClick={() => handleSecondChoice(fig.id)}
                  className="group p-4 rounded-xl border-2 border-border hover:border-blue-400 hover:shadow-lg transition-all text-center"
                >
                  <div className={`text-4xl mb-2 ${fig.color} group-hover:scale-110 transition-transform`}>
                    {fig.symbol}
                  </div>
                  <p className="text-sm font-medium">{fig.name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Шаг 3: Результат */}
        {step === "result" && selectedFigure && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Тест завершён!</h1>
              <p className="text-muted-foreground">Ваша фигура: <strong>{selectedFigure.name}</strong></p>
            </div>

            <div className={`p-8 rounded-2xl border-2 ${selectedFigure.bgColor} border-border text-center`}>
              <div className={`text-7xl mb-4 ${selectedFigure.color}`}>{selectedFigure.symbol}</div>
              <h2 className={`text-2xl font-bold ${selectedFigure.color} mb-1`}>{selectedFigure.name}</h2>
              <p className="text-lg font-medium text-foreground mb-4">{selectedFigure.title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{selectedFigure.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold text-lg mb-3">Сильные стороны</h3>
                <ul className="space-y-2">
                  {selectedFigure.strengths.map((s, i) => (
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
                  {selectedFigure.growth.map((g, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {secondChoice && (
              <div className="p-4 rounded-xl border bg-card text-center text-sm text-muted-foreground">
                Ваш дополнительный выбор: <strong>{FIGURES.find(f => f.id === secondChoice)?.name}</strong>
              </div>
            )}

            <div className="p-6 rounded-xl border bg-card">
              <h3 className="font-semibold text-lg mb-2">Связь с MBTI</h3>
              <p className="text-sm text-muted-foreground">{selectedFigure.mbtiCorrelation}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push("/profile")}>Мой профиль</Button>
              <Button onClick={() => router.push("/tests")}>Другие тесты</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}