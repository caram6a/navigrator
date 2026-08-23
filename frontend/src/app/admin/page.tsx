"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, Users as UsersIcon, BookOpen, Swords, CheckCircle, XCircle, Loader2, Plus, Trash2, Edit3, Save, StickyNote, User, Cloud, RefreshCw } from "lucide-react";
import { ApiError, users as usersApi, notes as notesApi, syncLocalToApi } from "@/lib/api";

type Tab = "helpers" | "players" | "all" | "competencies" | "games" | "notes";

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

interface AdminNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
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

function getAdminNotes(): AdminNote[] {
  return JSON.parse(localStorage.getItem("adminNotes") || "[]");
}

function saveAdminNotes(list: AdminNote[]) {
  localStorage.setItem("adminNotes", JSON.stringify(list));
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("helpers");
  const [userList, setUserList] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [newCompName, setNewCompName] = useState("");
  const [editingComp, setEditingComp] = useState<{ id: number; name: string } | null>(null);
  const [editingGame, setEditingGame] = useState<AdminGame | null>(null);
  const [showGameForm, setShowGameForm] = useState(false);
  const [gameForm, setGameForm] = useState<AdminGame>({
    id: 0, title: "", description: "", complexity: "Средняя", competencies: []
  });
  const [noteText, setNoteText] = useState("");
  const [allUsersExpanded, setAllUsersExpanded] = useState(false);

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

    // Загружаем пользователей из API
    usersApi.list().then((res: any) => {
      setUserList(res.users);
    }).catch(() => {
      // Fallback на localStorage
      const all = JSON.parse(localStorage.getItem("users") || "[]");
      setUserList(all);
    });

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
    setNotes(getAdminNotes());

    // Синхронизация заметок между вкладками
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "adminNotes") {
        setNotes(JSON.parse(e.newValue || "[]"));
      }
    };
    window.addEventListener("storage", handleStorage);
    // Периодическая проверка (для синхронизации между разными браузерами — заглушка)
    const interval = setInterval(() => {
      setNotes(getAdminNotes());
    }, 5000);

    setLoading(false);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [router]);

  const toggleVerify = async (userId: string) => {
    try {
      await usersApi.verify(userId);
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, isVerified: true } : u));
    } catch {
      // fallback на localStorage
      const all = JSON.parse(localStorage.getItem("users") || "[]");
      const idx = all.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        all[idx].is_verified = !all[idx].is_verified;
        localStorage.setItem("users", JSON.stringify(all));
        setUserList([...all]);
      }
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await usersApi.updateRole(userId, newRole);
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      // fallback на localStorage
      const all = JSON.parse(localStorage.getItem("users") || "[]");
      const idx = all.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        all[idx].role = newRole;
        localStorage.setItem("users", JSON.stringify(all));
        setUserList([...all]);
      }
    }
  };

  const addCompetency = () => {
    if (!newCompName.trim()) return;
    const comps = getCompetencies();
    comps.push({ id: Date.now(), name: newCompName.trim() });
    saveCompetencies(comps);
    setCompetencies(comps);
    setNewCompName("");
  };

  const deleteCompetency = (id: number) => {
    saveCompetencies(getCompetencies().filter(c => c.id !== id));
    setCompetencies(getCompetencies());
  };

  const saveCompName = (comp: Competency, newName: string) => {
    const comps = getCompetencies().map(c => c.id === comp.id ? { ...c, name: newName } : c);
    saveCompetencies(comps);
    setCompetencies(comps);
    // Обновляем название во всех играх
    let adminGames = getAdminGames();
    adminGames = adminGames.map(game => ({
      ...game,
      competencies: game.competencies.map(c => c.name === comp.name ? { ...c, name: newName } : c)
    }));
    saveAdminGames(adminGames);
    setGames(adminGames);
    setEditingComp(null);
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
    saveAdminGames(getAdminGames().filter(g => g.id !== id));
    setGames(getAdminGames());
  };

  const toggleGameComp = (compName: string) => {
    const exists = gameForm.competencies.find(c => c.name === compName);
    if (exists) {
      setGameForm(prev => ({ ...prev, competencies: prev.competencies.filter(c => c.name !== compName) }));
    } else {
      setGameForm(prev => ({ ...prev, competencies: [...prev.competencies, { name: compName, score: 5 }] }));
    }
  };

  const updateGameCompScore = (compName: string, score: number) => {
    setGameForm(prev => ({
      ...prev,
      competencies: prev.competencies.map(c => c.name === compName ? { ...c, score: Math.max(1, Math.min(10, score)) } : c)
    }));
  };

  // Заметки — гибрид: локально + API
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [syncingNotes, setSyncingNotes] = useState(false);

  const loadNotes = useCallback(async () => {
    // Сначала загружаем локальные
    const local = getAdminNotes();
    setNotes(local);
    // Пытаемся загрузить с API
    try {
      const data = await notesApi.list();
      if (data.notes) {
        setNotes(data.notes.map((n: any) => ({
          id: n.id,
          text: n.text,
          authorId: n.author.id,
          authorName: n.author.name,
          createdAt: n.createdAt,
        })));
        // Обновляем локальный кеш
        saveAdminNotes(data.notes.map((n: any) => ({
          id: n.id,
          text: n.text,
          authorId: n.author.id,
          authorName: n.author.name,
          createdAt: n.createdAt,
        })));
        setApiConnected(true);
      }
    } catch {
      setApiConnected(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "notes") loadNotes();
  }, [tab, loadNotes]);

  const addNote = async () => {
    if (!noteText.trim() || !currentUser) return;
    // Пытаемся через API
    if (apiConnected) {
      try {
        const data = await notesApi.create({ text: noteText.trim() });
        const newNote: AdminNote = {
          id: data.note.id,
          text: data.note.text,
          authorId: data.note.author.id,
          authorName: data.note.author.name,
          createdAt: data.note.createdAt,
        };
        const allNotes = getAdminNotes();
        allNotes.push(newNote);
        saveAdminNotes(allNotes);
        setNotes(allNotes);
        setNoteText("");
        return;
      } catch {
        // fallback to localStorage
      }
    }
    // LocalStorage fallback
    const newNote: AdminNote = {
      id: Date.now().toString(),
      text: noteText.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    const allNotes = getAdminNotes();
    allNotes.push(newNote);
    saveAdminNotes(allNotes);
    setNotes(allNotes);
    setNoteText("");
  };

  const deleteNote = async (id: string) => {
    if (apiConnected) {
      try {
        await notesApi.delete(id);
      } catch {
        // fallback
      }
    }
    saveAdminNotes(getAdminNotes().filter(n => n.id !== id));
    setNotes(getAdminNotes());
  };

  const syncNotesToApi = async () => {
    setSyncingNotes(true);
    try {
      await syncLocalToApi("/api/notes", "adminNotes", (item) => ({ text: item.text }));
      await loadNotes();
    } catch (e) {
      console.error("Sync failed:", e);
    }
    setSyncingNotes(false);
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
    { key: "players", label: "Игроки", icon: User },
    { key: "all", label: "Все пользователи", icon: UsersIcon },
    { key: "competencies", label: "Компетенции", icon: BookOpen },
    { key: "games", label: "Игры", icon: Swords },
    { key: "notes", label: "Заметки", icon: StickyNote },
  ];

  const helpers = userList.filter((u: any) => u.role === "helper");
  const players = userList.filter((u: any) => u.role === "player");
  const adminsAndLeaders = userList.filter((u: any) => u.role === "admin" || u.role === "leader");
  const allUsers = userList;

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

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
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-yellow-600 dark:text-yellow-400">
                Заявки на рассмотрение
              </h2>
              {helpers.filter((u: any) => !u.is_verified).length === 0 ? (
                <p className="text-muted-foreground">Нет новых заявок</p>
              ) : (
                <div className="space-y-3">
                  {helpers.filter((u: any) => !u.is_verified).map((u: any) => (
                    <div key={u.id} className="p-4 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 bg-card flex items-center justify-between">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Зарегистрирован: {formatDate(u.created_at)}
                        </p>
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
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Все помощники</h2>
              {helpers.length === 0 ? (
                <p className="text-muted-foreground">Нет помощников</p>
              ) : (
                <div className="space-y-3">
                  {helpers.map((u: any) => (
                    <div key={u.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={"text-xs px-2 py-0.5 rounded-full " + (u.is_verified
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300")}>
                            {u.is_verified ? "Одобрен" : "На проверке"}
                          </span>
                          {u.mbti_type && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                              {u.mbti_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!u.is_verified && (
                          <Button size="sm" variant="outline" onClick={() => toggleVerify(u.id)}>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Одобрить
                          </Button>
                        )}
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="text-sm px-2 py-1 rounded border bg-background"
                        >
                          <option value="helper">Помощник</option>
                          <option value="player">Игрок</option>
                          <option value="leader">Лидер</option>
                          <option value="admin">Админ</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "players" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Игроки ({players.length})</h2>
            {players.length === 0 ? (
              <p className="text-muted-foreground">Нет игроков</p>
            ) : (
              <div className="space-y-3">
                {players.map((u: any) => (
                  <div key={u.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Игрок
                        </span>
                        {u.mbti_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            {u.mbti_type}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                    </div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "all" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Все пользователи ({allUsers.length})
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({adminsAndLeaders.length} админов/лидеров, {helpers.length} помощников, {players.length} игроков)
              </span>
            </h2>
            {allUsers.length === 0 ? (
              <p className="text-muted-foreground">Нет пользователей</p>
            ) : (
              <div className="space-y-3">
                {allUsers.sort((a: any, b: any) => {
                  const roleOrder: Record<string, number> = { admin: 0, leader: 1, helper: 2, player: 3 };
                  return (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
                }).map((u: any) => (
                  <div key={u.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className={"text-xs px-2 py-0.5 rounded-full " + (
                          u.role === "admin" ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" :
                          u.role === "leader" ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300" :
                          u.role === "helper" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" :
                          "bg-primary/10 text-primary"
                        )}>
                          {roleLabels[u.role] || u.role}
                        </span>
                        {u.is_verified && u.role === "helper" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                            Одобрен
                          </span>
                        )}
                        {!u.is_verified && u.role === "helper" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                            На проверке
                          </span>
                        )}
                        {u.mbti_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            {u.mbti_type}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                    </div>
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
                  </div>
                ))}
              </div>
            )}
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
                  {editingComp?.id === comp.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingComp.name}
                        onChange={(e) => setEditingComp({ ...editingComp, name: e.target.value })}
                        className="flex-1 px-2 py-1 rounded border bg-background text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCompName(comp, editingComp.name);
                          if (e.key === "Escape") setEditingComp(null);
                        }}
                        autoFocus
                      />
                      <button onClick={() => saveCompName(comp, editingComp.name)} className="text-green-500 hover:text-green-600">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingComp(null)} className="text-muted-foreground hover:text-destructive">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{comp.name}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingComp({ id: comp.id, name: comp.name })} className="text-muted-foreground hover:text-primary transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteCompetency(comp.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "games" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Управление играми</h2>
              <Button onClick={startNewGame}><Plus className="h-4 w-4 mr-1" /> Новая игра</Button>
            </div>

            {showGameForm && (
              <div className="p-6 rounded-xl border bg-card space-y-4">
                <h3 className="font-semibold text-lg">{editingGame ? "Редактировать игру" : "Новая игра"}</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input type="text" value={gameForm.title} onChange={(e) => setGameForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border bg-background" placeholder="Название игры" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <textarea value={gameForm.description} onChange={(e) => setGameForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border bg-background" rows={3} placeholder="Описание игры" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Сложность</label>
                  <select value={gameForm.complexity} onChange={(e) => setGameForm(prev => ({ ...prev, complexity: e.target.value }))} className="w-full px-3 py-2 rounded-lg border bg-background">
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
                          <input type="checkbox" checked={!!selected} onChange={() => toggleGameComp(comp.name)} className="w-4 h-4" />
                          <span className="text-sm flex-1">{comp.name}</span>
                          {selected && (
                            <input type="number" min={1} max={10} value={selected.score} onChange={(e) => updateGameCompScore(comp.name, parseInt(e.target.value) || 5)} className="w-14 px-2 py-1 rounded border bg-background text-sm text-center" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveGame} disabled={!gameForm.title.trim()}><Save className="h-4 w-4 mr-1" /> Сохранить</Button>
                  <Button variant="outline" onClick={() => { setShowGameForm(false); setEditingGame(null); }}>Отмена</Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {games.map((game) => (
                <div key={game.id} className="p-4 rounded-xl border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{game.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{game.complexity}</span>
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
                    <Button size="sm" variant="outline" onClick={() => startEditGame(game)}><Edit3 className="h-3 w-3 mr-1" /> Править</Button>
                    <Button size="sm" variant="outline" onClick={() => deleteGame(game.id)}><Trash2 className="h-3 w-3 mr-1 text-red-500" /> Удалить</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Заметки администраторов
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {apiConnected === true ? "🟢 через API" : apiConnected === false ? "🟡 локально" : "⚪ проверка..."}
                </span>
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadNotes} disabled={syncingNotes}>
                  <RefreshCw className={"h-4 w-4 mr-1 " + (syncingNotes ? "animate-spin" : "")} />
                  Обновить
                </Button>
                <Button variant="outline" size="sm" onClick={syncNotesToApi} disabled={syncingNotes}>
                  <Cloud className="h-4 w-4 mr-1" />
                  Синхр.
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Напишите заметку..."
                className="flex-1 px-3 py-2 rounded-lg border bg-background"
                rows={3}
              />
            </div>
            <Button onClick={addNote} disabled={!noteText.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Добавить заметку
            </Button>

            {notes.length === 0 ? (
              <p className="text-muted-foreground">Нет заметок</p>
            ) : (
              <div className="space-y-3">
                {[...notes].reverse().map((note) => (
                  <div key={note.id} className="p-4 rounded-xl border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{note.authorName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                      </div>
                      <button onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}