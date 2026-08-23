"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Send, User, ArrowLeft, Brain, Gamepad2, CheckCircle, Loader2 } from "lucide-react";
import { GAMES } from "@/lib/games-data";

interface Message {
  id: string;
  role: "player" | "helper" | "system";
  text: string;
  timestamp: string;
  read: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [helper, setHelper] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionId = params.sessionId;
    if (!sessionId) { setLoading(false); return; }

    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    let foundSession: any = null;
    let foundPlayer: any = null;
    let foundHelper: any = null;

    for (const u of allUsers) {
      const sessions = JSON.parse(localStorage.getItem("gameSessions_" + u.id) || "[]");
      const s = sessions.find((s: any) => s.id === sessionId);
      if (s) { foundSession = s; foundPlayer = u; break; }
    }

    if (!foundSession) { setLoading(false); return; }

    const h = allUsers.find((u: any) => u.id === foundSession.helperId);
    if (h) foundHelper = h;

    setSession(foundSession);
    setPlayer(foundPlayer);
    setHelper(foundHelper);

    const userData = localStorage.getItem("currentUser");
    if (userData) { try { setCurrentUser(JSON.parse(userData)); } catch {} }

    const chatKey = "chat_" + sessionId;
    const saved = JSON.parse(localStorage.getItem(chatKey) || "[]");
    setMessages(saved);
    setLoading(false);
  }, [params.sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session || !currentUser) return;
    const chatKey = "chat_" + session.id;
    const userRole = currentUser.id === player?.id ? "player" : "helper";
    const updated = messages.map(m => {
      if (m.role !== "system" && m.role !== userRole) return { ...m, read: true };
      return m;
    });
    const changed = updated.some((m, i) => m.read !== messages[i]?.read);
    if (changed) localStorage.setItem(chatKey, JSON.stringify(updated));
  }, [messages, currentUser, session, player?.id]);

  const sendMessage = () => {
    if (!newMessage.trim() || !session || !currentUser) return;
    const role = currentUser.id === player?.id ? "player" : "helper";
    const msg: Message = {
      id: Date.now().toString(),
      role, text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const chatKey = "chat_" + session.id;
    const updated = [...messages, msg];
    setMessages(updated);
    localStorage.setItem(chatKey, JSON.stringify(updated));
    setNewMessage("");

    if (role === "player" && helper) {
      setTimeout(() => {
        const replies = [
          "Отлично! Давайте обсудим стратегию.", "Понял. Как думаете, что можно улучшить?",
          "Хороший вопрос! Давайте разберём это подробнее.",
          "Интересно. А что вы чувствовали во время игры?",
          "Я бы посоветовал обратить внимание на этот аспект.",
          "Договорились! Когда удобно встретиться в следующий раз?",
          "Отличная работа! Вы заметно прогрессируете.",
        ];
        const reply: Message = {
          id: (Date.now() + 1).toString(), role: "helper",
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toISOString(), read: false,
        };
        const cc = JSON.parse(localStorage.getItem(chatKey) || "[]");
        cc.push(reply);
        localStorage.setItem(chatKey, JSON.stringify(cc));
        setMessages(prev => [...prev, reply]);
      }, 1000 + Math.random() * 1500);
    }
    if (role === "helper" && player) {
      setTimeout(() => {
        const replies = [
          "Спасибо за совет! Попробую.", "Да, я понял. Есть ещё вопросы.",
          "Отлично, договорились!", "А можно ещё раз объяснить?", "Здорово, уже вижу прогресс!",
        ];
        const reply: Message = {
          id: (Date.now() + 1).toString(), role: "player",
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toISOString(), read: false,
        };
        const cc = JSON.parse(localStorage.getItem(chatKey) || "[]");
        cc.push(reply);
        localStorage.setItem(chatKey, JSON.stringify(cc));
        setMessages(prev => [...prev, reply]);
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };
  const formatDate = (ts: string) => {
    try { return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }); }
    catch { return ""; }
  };

  const completeSession = () => {
    if (!session || !player) return;
    const sessions = JSON.parse(localStorage.getItem("gameSessions_" + player.id) || "[]");
    const idx = sessions.findIndex((s: any) => s.id === session.id);
    if (idx !== -1) {
      sessions[idx].status = "completed";
      localStorage.setItem("gameSessions_" + player.id, JSON.stringify(sessions));
      const sysMsg: Message = {
        id: Date.now().toString(), role: "system",
        text: "Сессия завершена. Пройдите повторный тест для отслеживания прогресса.",
        timestamp: new Date().toISOString(), read: true,
      };
      const chatKey = "chat_" + session.id;
      const updated = [...messages, sysMsg];
      setMessages(updated);
      localStorage.setItem(chatKey, JSON.stringify(updated));
      setSession({ ...session, status: "completed" });
    }
  };

  if (loading) {
    return (<div className="container mx-auto px-4 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>);
  }
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Чат не найден</h2>
        <p className="text-muted-foreground mb-4">Сессия не существует или была удалена</p>
        <button onClick={() => router.push("/profile")} className="text-primary hover:underline">Вернуться в профиль</button>
      </div>
    );
  }

  const isPlayer = currentUser?.id === player?.id;
  const companion = isPlayer ? helper : player;

  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";
  messages.forEach(m => {
    const date = formatDate(m.timestamp);
    if (date !== currentDate) { currentDate = date; groupedMessages.push({ date, messages: [m] }); }
    else { groupedMessages[groupedMessages.length - 1].messages.push(m); }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Шапка */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 gap-3">
            <button onClick={() => router.push("/profile")} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{companion?.name || "Чат"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={session.status === "completed" ? "text-green-500" : "text-amber-500"}>
                  {session.status === "completed" ? "Завершена" : "Активна"}
                </span>
                {session.gameId && (<><span>·</span><Gamepad2 className="h-3 w-3" /><span>{GAMES.find(g => g.id === session.gameId)?.title || "Без игры"}</span></>)}
              </div>
            </div>
            {session.status === "pending" && isPlayer && (
              <button onClick={completeSession} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 transition-colors">
                <CheckCircle className="h-4 w-4" /> Завершить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Чат с {companion?.name}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Обсуждайте игровые сессии, делитесь впечатлениями и получайте рекомендации от наставника.
              </p>
            </div>
          )}

          {groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="text-center mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{group.date}</span>
              </div>
              <div className="space-y-3">
                {group.messages.map((msg) => {
                  const isMine = (isPlayer && msg.role === "player") || (!isPlayer && msg.role === "helper");
                  return (
                    <div key={msg.id} className={`flex ${msg.role === "system" ? "justify-center" : isMine ? "justify-end" : "justify-start"}`}>
                      {msg.role === "system" ? (
                        <div className="text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full max-w-lg text-center">{msg.text}</div>
                      ) : (
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatTime(msg.timestamp)}</span>
                            {isMine && (<span className={`text-[10px] ${msg.read ? "text-blue-300" : "text-primary-foreground/40"}`}>{msg.read ? "✓✓" : "✓"}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Ввод */}
      {session.status === "pending" && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
            <div className="max-w-3xl mx-auto flex gap-3">
              <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-2.5 rounded-xl border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={sendMessage} disabled={!newMessage.trim()}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {session.status === "completed" && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm text-muted-foreground mb-2">Сессия завершена</p>
              <button onClick={() => router.push("/test")} className="text-sm text-primary hover:underline">Пройти повторный тест</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}