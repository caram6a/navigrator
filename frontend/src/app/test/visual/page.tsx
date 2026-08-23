"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shapes, ArrowLeft, CheckCircle, Brain, Loader2 } from "lucide-react";
import { generateQuestions, calculateResult, saveResult, FIGURE_DEFS, COLORS, STROKE_WIDTHS, SCALES, type VisualTestResult, type TestQuestion } from "@/lib/visual-test";

function FigureSVG({ shape, variant, color, fill, size }: {
  shape: string;
  variant: number;
  color: typeof COLORS[0];
  fill: boolean;
  size: number;
}) {
  const def = FIGURE_DEFS[shape];
  if (!def) return null;
  const v = def.variants[variant] || def.variants[0];
  // Увеличиваем viewBox, чтобы фигура не обрезалась при size=1.2
  const vbSize = 120;
  const scale = size * 0.8;
  const cx = 60;
  const cy = 60;

  return (
    <svg viewBox={`0 0 ${vbSize} ${vbSize}`} className="w-full h-full">
      <g transform={`translate(${cx - 50 * scale},${cy - 50 * scale}) scale(${scale})`}>
        <g
          dangerouslySetInnerHTML={{
            __html: v.path
              .replace('fill="none"', `fill="${fill ? color.fill : "none"}"`)
              .replace('stroke-width="6"', `stroke="${color.stroke}" stroke-width="6"`)
              .replace('<circle', `<circle fill="${fill ? color.fill : "none"}" stroke="${color.stroke}" stroke-width="3"`)
              .replace('<ellipse', `<ellipse fill="${fill ? color.fill : "none"}" stroke="${color.stroke}" stroke-width="3"`)
              .replace('<rect', `<rect fill="${fill ? color.fill : "none"}" stroke="${color.stroke}" stroke-width="3"`)
              .replace('<polygon', `<polygon fill="${fill ? color.fill : "none"}" stroke="${color.stroke}" stroke-width="3"`)
              .replace('<polyline', `<polyline fill="${fill ? color.fill : "none"}" stroke="${color.stroke}" stroke-width="3"`)
              .replace('<path', `<path fill="${fill ? color.fill : "none"}" stroke="${color.stroke}" stroke-width="3"`)
          }}
        />
      </g>
    </svg>
  );
}

export default function VisualTestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<VisualTestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRetake, setIsRetake] = useState(false);

  useEffect(() => {
    const qs = generateQuestions();
    setQuestions(qs);
    const token = localStorage.getItem("token");
    const key = token ? ("visualTestResults_" + token) : "guestVisualTestResults";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (existing.length > 0) setIsRetake(true);
  }, []);

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion + 1]: value }));
    // Через небольшую задержку переходим к следующему
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 200);
    }
  };

  const handleSubmit = () => {
    if (submitting || Object.keys(answers).length !== questions.length) return;
    setSubmitting(true);
    const res = calculateResult(answers, questions);
    saveResult(res);
    setResult(res);
    setSubmitting(false);
  };

  const answeredCount = Object.keys(answers).length;
  const q = questions[currentQuestion];
  const currentAnswer = answers[currentQuestion + 1] || 0;

  if (result) {
    const scales = SCALES;
    const sortedScales = [...scales].sort((a, b) => {
      const aScore = result.scales[a.id]?.score || 50;
      const bScore = result.scales[b.id]?.score || 50;
      return Math.abs(bScore - 50) - Math.abs(aScore - 50);
    });

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Тест завершён!</h1>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">{result.profile}</p>
            <p className="text-muted-foreground">80 вопросов · 10 шкал личности</p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <h2 className="font-semibold text-lg mb-3">Ваш профиль личности</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{result.description}</p>
          </div>

          <div className="grid gap-3">
            <h2 className="font-semibold text-lg">Шкалы личности</h2>
            {sortedScales.map(s => {
              const data = result.scales[s.id];
              if (!data) return null;
              const dominant = data.score >= 50 ? s.leftLabel : s.rightLabel;
              const pct = data.score >= 50 ? data.score : 100 - data.score;
              return (
                <div key={s.id} className="p-4 rounded-xl border bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-sm font-bold">{dominant} ({pct}%)</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{s.leftLabel}</span>
                    <span>{s.rightLabel}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all rounded-full"
                      style={{ width: data.score + "%" }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{data.left} выборов</span>
                    <span>{data.right} выборов</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/profile")}>Мой профиль</Button>
            <Button onClick={() => router.push("/tests")}>Другие тесты</Button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (<div className="container mx-auto px-4 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/tests")}><ArrowLeft className="h-4 w-4 mr-2" /> К тестам</Button>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold"><Shapes className="h-7 w-7 inline mr-2 text-blue-500" />Визуальный тест личности</h1>
          <p className="text-sm text-muted-foreground">Выбери фигуру, которая нравится больше</p>
          {isRetake && <p className="text-xs text-amber-600 dark:text-amber-400">Повторное прохождение</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = i === currentQuestion;
            return (
              <button key={q.id} type="button" onClick={() => setCurrentQuestion(i)}
                className={"w-7 h-7 rounded-full text-xs font-medium transition-all " + (isCurrent ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30" : isAnswered ? "bg-primary/80 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                {q.id}
              </button>
            );
          })}
        </div>

        <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300 rounded-full" style={{ width: (answeredCount / questions.length) * 100 + "%" }} />
        </div>

        {q && (
          <div className="p-6 rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground mb-4 text-center">Вопрос {q.id} из {questions.length}</p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { side: "left", shape: q.leftShape, variant: q.leftVariant, color: q.leftColor, fill: q.leftFill, size: q.leftSize, label: 1 },
                { side: "right", shape: q.rightShape, variant: q.rightVariant, color: q.rightColor, fill: q.rightFill, size: q.rightSize, label: 7 },
              ].map((item) => (
                <button
                  key={item.side}
                  onClick={() => handleAnswer(item.label)}
                  className={"group p-6 rounded-xl border-2 transition-all text-center cursor-pointer " +
                    (currentAnswer === item.label
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md"
                      : "border-border hover:border-blue-300 hover:shadow-sm hover:bg-accent/50")}
                >
                  <div className="w-24 h-24 mx-auto mb-3">
                    <FigureSVG
                      shape={item.shape}
                      variant={item.variant}
                      color={item.color}
                      fill={item.fill}
                      size={item.size}
                    />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7].map(v => (
                    <span key={v}
                      className={"inline-block w-3 h-3 rounded-full mx-0.5 transition-all " +
                        (currentAnswer === v ?
                          (currentAnswer === item.label ? "bg-blue-500 scale-125" : "bg-primary/30")
                          : "bg-muted-foreground/20")}
                    />
                  ))}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))} disabled={currentQuestion === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Назад
          </Button>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(prev => prev + 1)} disabled={!currentAnswer}>
              Далее
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || answeredCount !== questions.length}>
              {submitting ? "Обработка..." : "Завершить тест"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}