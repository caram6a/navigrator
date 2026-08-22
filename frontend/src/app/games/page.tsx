"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Swords, Star } from "lucide-react";
import { GAMES } from "@/lib/games-data";

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  const getComplexityColor = (c: string) => {
    switch (c) {
      case "Высокая": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50";
      case "Средняя": return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50";
      case "Низкая": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50";
      default: return "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <Swords className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Каталог игр</h1>
        <p className="text-muted-foreground">Выберите игру для развития навыков</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={
              "p-6 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md " +
              (selectedGame === game.id ? "ring-2 ring-primary" : "")
            }
            onClick={() => setSelectedGame(game.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{game.title}</h3>
              <span className={"text-xs px-2 py-1 rounded-full font-medium " + getComplexityColor(game.complexity)}>
                {game.complexity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Развиваемые навыки:</p>
              {game.competencies.map((comp, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{comp.name}</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    {comp.score}/10
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-md mx-auto">
        <div className="text-center p-6 rounded-xl border bg-card">
          <p className="text-muted-foreground mb-4">
            {selectedGame
              ? "Для создания сессии с помощником необходимо войти в систему"
              : "Выберите игру, чтобы увидеть подробности"}
          </p>
          <Button onClick={() => window.location.href = "/login"}>Войти</Button>
        </div>
      </div>
    </div>
  );
}