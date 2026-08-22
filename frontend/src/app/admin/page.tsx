"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, Users as UsersIcon, BookOpen, Swords, CheckCircle, XCircle, Loader2, Plus, Trash2, Edit3, Save } from "lucide-react";

type Tab = "helpers" | "users" | "competencies" | "games";

interface Competency {
  id: number;
  name: string;
}

interface AdminGame {
  id: number;
  title: string;
  description: string;
  complexity: string;
  competencies: { name: string; score: number }[];
}

function getCompetencies(): Competency[] {
  return JSON.parse(localStorage.getItem("competencies") || "[]");
}

function saveCompetencies(list: Competency[]) {
  localStorage.setItem("competencies", JSON.stringify(list));
}

function getAdminGames(): AdminGame[] {
  return JSON.parse(localStorage.getItem("adminGames") || "[]");
}

function saveAdminGames(list: AdminGame[]) {
  localStorage.setItem("adminGames", JSON.stringify(list));
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("helpers");
  const [userList, setUserList] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [newCompName, setNewCompName] = useState("");
  const [editingGame, setEditingGame] = useState<AdminGame | null>(null);
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameForm, setGameForm] = useState<AdminGame>({
    id: 0, title: "", description: "", complexity: "Средняя", competencies: []
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.role !== "admin" && parsed.role !== "leader") {
          router.push("/");
          return;
        }
        setCurrentUser(parsed);
      } catch {
        router.push("/login");
        return;
      }
    } else {
      router.push("/login");
      return;
    }

    const all = JSON.parse(localStorage.getItem("users") || "[]");
    setUserList(all);

    let comps = getCompetencies();
    if (comps.length === 0) {
      const defaultComps = [
        "Стратегическое мышление", "Принятие решений", "Управление ресурсами",
        "Коммуникация", "Анализ данных", "Внимание к деталям", "Работа в команде",
        "Терпение", "Пространственное мышление", "Убеждение", "Эмпатия",
        "Управление конфликтами", "Креативность", "Логическое мышление"
      ];
      comps = defaultComps.map((name, i) => ({ id: i + 1, name }));
      saveCompetencies(comps);
    }
    setCompetencies(comps);

    let adminGames = getAdminGames();
    if (adminGames.length === 0) {
      const { GAMES } = require("@/lib/games-data");
      adminGames = GAMES.map((g: any) => ({ ...g }));
      saveAdminGames(adminGames);
    }
    setGames(adminGames);

    setLoading(false);
  }, [router]);

  const toggleVerify = (userId: string) => {
    const all = JSON.parse(localStorage.getItem("users") || "[]");
    const idx = all.findIndex((u: any) => u.id === userId);
    if (idx !== -1) {
      all[idx].is_verified = !all[idx].is_verified;
      localStorage.setItem("users", JSON.stringify(all));
      setUserList([...all]);
    }
  };

  const changeRole = (userId: string, newRole: string) => {
    const all = JSON.parse(localStorage.getItem("users") || "[]");
    const idx = all.findIndex((u: any) => u.id === userId);
    if (idx !== -1) {
      all[idx].role = newRole;
      localStorage.setItem("users", JSON.stringify(all));
      setUserList([...all]);
    }
  };

  const addCompetency = () => {
    if (!newCompName.trim()) return;
    const comps = getCompetencies();
    const newComp = { id: Date.now(), name: newCompName.trim() };
    comps.push(newComp);
    saveCompetencies(comps);
    setCompetencies(comps);
    setNewCompName("");
  };

  const deleteCompetency = (id: number) => {
    const comps = getCompetencies().filter(c => c.id !== id);
    saveCompetencies(comps);
    setCompetencies(comps);
  };

  const startNewGame = () => {
    setGameForm({ id: Date.now(), title: "", description: "", complexity: "Средняя", competencies: [] });
    setEditingGame(null);
    setShowGameForm(true);
  };

  const startEditGame = (game: AdminGame) => {
    setGameForm({ ...game });
    setEditingGame(game);
    setShowGameForm(true);
  };

  const saveGame = () => {
    if (!gameForm.title.trim()) return;
    let adminGames = getAdminGames();
    if (editingGame) {
      const idx = adminGames.findIndex(g => g.id === editingGame.id);
      if (idx !== -1) adminGames[idx] = { ...gameForm };
    } else {
      adminGames.push({ ...gameForm, id: Date.now() });
    }
    saveAdminGames(adminGames);
    setGames(adminGames);
    setShowGameForm(false);
    setEditingGame(null);
  };

  const deleteGame = (id: number) => {
    let adminGames = getAdminGames().filter(g => g.id !== id);
    saveAdminGames(adminGames);
    setGames(adminGames);
  };

  const toggleGameComp = (compName: string) => {
    const exists = gameForm.competencies.find(c => c.name === compName);
    if (exists) {
      setGameForm(prev => ({
        ...prev,
        competencies: prev.competencies.filter(c => c.name !== compName)
      }));
    } else {
      setGameForm(prev => ({
        ...prev,
        competencies: [...prev.competencies, { name: compName, score: 5 }]
      }));
    }
  };

  const updateGameCompScore = (compName: string, score: number) => {
    setGameForm(prev => ({
      ...prev,
      competencies: prev.competencies.map(c =>
        c.name === compName ? { ...c, score: Math.max(1, Math.min(10, score)) } : c
      )
    }));
  };

  const roleLabels: Record<string, string> = {
    admin: "Администратор",
    leader: "Лидер",
    helper: "Помощник",
    player: "Игрок",
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) return null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "helpers", label: "Помощники", icon: UsersIcon },
    { key: "users", label: "Пользователи", icon: UsersIcon },
    { key: "competencies", label: "Компетенции", icon: BookOpen },
    { key: "games", label: "Игры", icon: Swords },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Админ-панель</h1>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1"
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Button>
          ))}
        </div>

        {tab === "helpers" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Помощники на проверке</h2>
            {userList.filter((u: any) => u.role === "helper" && !u.is_verified).length === 0 ? (
              <p className="text-muted-foreground">Нет непроверенных помощников</p>
            ) : (
              userList
                .filter((u: any) => u.role === "helper" && !u.is_verified)
                .map((u: any) => (
                  <div key={u.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleVerify(u.id)}>
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Одобрить
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => changeRole(u.id, "player")}>
                        <XCircle className="h-4 w-4 mr-1 text-red-500" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Все пользователи</h2>
            {userList.map((u: any) => (
              <div key={u.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {roleLabels[u.role] || u.role}
                    </span>
                    {u.mbti_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        {u.mbti_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="text-sm px-2 py-1 rounded border bg-background"
                  >
                    <option value="player">Игрок</option>
                    <option value="helper">Помощник</option>
                    <option value="leader">Лидер</option>
                    <option value="admin">Админ</option>
                  </select>
                  {u.role === "helper" && (
                    <Button size="sm" variant="outline" onClick={() => toggleVerify(u.id)}>
                      {u.is_verified ? "Заблокировать" : "Одобрить"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "competencies" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Управление компетенциями</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                placeholder="Название новой компетенции"
                className="flex-1 px-3 py-2 rounded-lg border bg-background"
                onKeyDown={(e) => e.key === "Enter" && addCompetency()}
              />
              <Button onClick={addCompetency} disabled={!newCompName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {competencies.map((comp) => (
                <div key={comp.id} className="p-3 rounded-xl border bg-card flex items-center justify-between">
                  <span className="text-sm font-medium">{comp.name}</span>
                  <button
                    onClick={() => deleteCompetency(comp.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "games" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Управление играми</h2>
              <Button onClick={startNewGame}>
                <Plus className="h-4 w-4 mr-1" /> Новая игра
              </Button>
            </div>

            {showGameForm && (
              <div className="p-6 rounded-xl border bg-card space-y-4">
                <h3 className="font-semibold text-lg">
                  {editingGame ? "Редактировать игру" : "Новая игра"}
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input
                    type="text"
                    value={gameForm.title}
                    onChange={(e) => setGameForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                    placeholder="Название игры"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <textarea
                    value={gameForm.description}
                    onChange={(e) => setGameForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                    rows={3}
                    placeholder="Описание игры"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Сложность</label>
                  <select
                    value={gameForm.complexity}
                    onChange={(e) => setGameForm(prev => ({ ...prev, complexity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  >
                    <option value="Низкая">Низкая</option>
                    <option value="Средняя">Средняя</option>
                    <option value="Высокая">Высокая</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Развиваемые компетенции</label>
                  <div className="grid grid-cols-2 gap-2">
                    {competencies.map((comp) => {
                      const selected = gameForm.competencies.find(c => c.name === comp.name);
                      return (
                        <div key={comp.id} className="flex items-center gap-2 p-2 rounded-lg border">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => toggleGameComp(comp.name)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm flex-1">{comp.name}</span>
                          {selected && (
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={selected.score}
                              onChange={(e) => updateGameCompScore(comp.name, parseInt(e.target.value) || 5)}
                              className="w-14 px-2 py-1 rounded border bg-background text-sm text-center"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveGame} disabled={!gameForm.title.trim()}>
                    <Save className="h-4 w-4 mr-1" /> Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => { setShowGameForm(false); setEditingGame(null); }}>
                    Отмена
                  </Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {games.map((game) => (
                <div key={game.id} className="p-4 rounded-xl border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{game.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {game.complexity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
                  <div className="space-y-1 mb-3">
                    {game.competencies.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{c.name}</span>
                        <span className="font-medium">{c.score}/10</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEditGame(game)}>
                      <Edit3 className="h-3 w-3 mr-1" /> Править
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteGame(game.id)}>
                      <Trash2 className="h-3 w-3 mr-1 text-red-500" /> Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}