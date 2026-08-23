"use client";

import { useRouter } from "next/navigation";
import { Brain, Shapes, ArrowRight } from "lucide-react";

const TESTS = [
  {
    id: "mbti",
    title: "MBTI-тест",
    subtitle: "Типология личности",
    description: "32 вопроса с биполярными шкалами. Определи свой тип личности среди 16 типов MBTI. Узнай свои сильные стороны и зоны роста.",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    borderColor: "border-purple-200 dark:border-purple-800",
    href: "/test/mbti",
    duration: "10-15 минут",
  },
  {
    id: "psychogeometry",
    title: "Психогеометрический тест",
    subtitle: "Геометрия личности",
    description: "Выбери фигуру, которая тебя олицетворяет. Узнай свой тип личности по методике Сьюзен Деллингер и его связь с MBTI.",
    icon: Shapes,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    href: "/test/psychogeometry",
    duration: "2-3 минуты",
  },
];

export default function TestsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Тесты личности</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Выбери тест, чтобы лучше узнать себя, свои сильные стороны и направления для роста
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {TESTS.map((test) => (
            <div
              key={test.id}
              className={`group p-8 rounded-2xl border-2 ${test.borderColor} ${test.bgColor} hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => router.push(test.href)}
            >
              <div className={`w-16 h-16 rounded-2xl ${test.color} bg-background flex items-center justify-center mb-5`}>
                <test.icon className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-bold mb-1">{test.title}</h2>
              <p className={`text-sm font-medium ${test.color} mb-3`}>{test.subtitle}</p>
              <p className="text-muted-foreground text-sm mb-4">{test.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{test.duration}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${test.color} group-hover:gap-2 transition-all`}>
                  Пройти тест <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl border bg-card text-center">
          <p className="text-sm text-muted-foreground">
            Каждый тест можно проходить несколько раз — результаты сохраняются и отображаются в профиле
          </p>
        </div>
      </div>
    </div>
  );
}