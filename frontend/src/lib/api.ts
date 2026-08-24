// API проксируется через Vercel (rewrites) — телефону не нужно обращаться напрямую к Railway, который может быть заблокирован операторами
const API_URL = "/api/backend";  // Прокси через Vercel

interface ApiOptions {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  console.log(`[API] ${options.method || "GET"} ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (fetchError: any) {
    console.error("[API] Fetch failed:", fetchError);
    throw new ApiError(`Сетевая ошибка: ${fetchError.message || "не удалось соединиться с сервером"}`, 0);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new ApiError(error.error || `HTTP ${response.status}`, response.status);
  }

  return response.json();
}

// Auth
export const auth = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    request<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: data,
    }),
  login: (data: { email: string; password: string }) =>
    request<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: data,
    }),
  me: () => request<{ user: any }>("/auth/me"),
};

// Users
export const users = {
  list: () => request<{ users: any[] }>("/users"),
  helpers: () => request<{ helpers: any[] }>("/users/helpers"),
  getById: (id: string) => request<{ user: any }>(`/users/${id}`),
  verify: (id: string) =>
    request<{ user: any }>(`/users/${id}/verify`, { method: "PUT" }),
  updateRole: (id: string, role: string) =>
    request<{ user: any }>(`/users/${id}/role`, {
      method: "PUT",
      body: { role },
    }),
};

// Competencies
export const competencies = {
  list: () => request<{ competencies: any[] }>("/competencies"),
  create: (data: { name: string; description: string }) =>
    request<{ competency: any }>("/competencies", {
      method: "POST",
      body: data,
    }),
  update: (id: string, data: { name: string; description: string }) =>
    request<{ competency: any }>(`/competencies/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/competencies/${id}`, { method: "DELETE" }),
};

// Games
export const games = {
  list: () => request<{ games: any[] }>("/games"),
  getById: (id: string) => request<{ game: any }>(`/games/${id}`),
  create: (data: any) =>
    request<{ game: any }>("/games", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    request<{ game: any }>(`/games/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<{ message: string }>(`/games/${id}`, { method: "DELETE" }),
};

// Sessions
export const sessions = {
  create: (data: { helperId: string; gameId: string }) =>
    request<{ session: any }>("/sessions", {
      method: "POST",
      body: data,
    }),
  complete: (id: string) =>
    request<{ session: any }>(`/sessions/${id}/complete`, { method: "PUT" }),
  my: () => request<{ sessions: any[] }>("/sessions/my"),
  all: () => request<{ sessions: any[] }>("/sessions"),
};

// Notes
export const notes = {
  list: () => request<{ notes: any[] }>("/notes"),
  create: (data: { text: string }) =>
    request<{ note: any }>("/notes", { method: "POST", body: data }),
  delete: (id: string) =>
    request<{ message: string }>(`/notes/${id}`, { method: "DELETE" }),
};

// Sync utils
export async function syncLocalToApi<T>(endpoint: string, localKey: string, mapper: (item: any) => any = (x) => x) {
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");
  if (localData.length === 0) return;
  try {
    for (const item of localData) {
      await request(endpoint, { method: "POST", body: mapper(item) }).catch(() => {});
    }
    localStorage.removeItem(localKey);
    console.log(`Synced ${localData.length} items from ${localKey} to API`);
  } catch (e) {
    console.warn(`Failed to sync ${localKey}:`, e);
  }
}

// Test
export const testApi = {
  questions: () => request<{ questions: any[]; dimensions: string[] }>("/test/questions"),
  submit: (answers: { questionId: number; value: number }[]) =>
    request<{
      mbtiType: string;
      dimensions: any;
      description: { title: string; description: string; strengths: string[]; growth: string[] };
    }>("/test/submit", {
      method: "POST",
      body: { answers },
    }),
  result: () =>
    request<{
      mbtiType: string;
      description: { title: string; description: string; strengths: string[]; growth: string[] };
    }>("/test/result"),
  saveResult: (testType: "mbti" | "visual", result: any) =>
    request<{ testResult: any }>("/test/save", {
      method: "POST",
      body: { testType, result },
    }),
  getResults: () => request<{ results: any[] }>("/test/results"),
  getResultsByType: (type: "mbti" | "visual") => request<{ results: any[] }>(`/test/results/${type}`),
};