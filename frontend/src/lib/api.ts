const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-05967.up.railway.app";

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Ошибка сети" }));
    throw new ApiError(error.error || "Ошибка сети", response.status);
  }

  return response.json();
}

// Auth
export const auth = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    request<{ user: any; token: string }>("/api/auth/register", {
      method: "POST",
      body: data,
    }),
  login: (data: { email: string; password: string }) =>
    request<{ user: any; token: string }>("/api/auth/login", {
      method: "POST",
      body: data,
    }),
  me: () => request<{ user: any }>("/api/auth/me"),
};

// Users
export const users = {
  list: () => request<{ users: any[] }>("/api/users"),
  helpers: () => request<{ helpers: any[] }>("/api/users/helpers"),
  getById: (id: string) => request<{ user: any }>(`/api/users/${id}`),
  verify: (id: string) =>
    request<{ user: any }>(`/api/users/${id}/verify`, { method: "PUT" }),
  updateRole: (id: string, role: string) =>
    request<{ user: any }>(`/api/users/${id}/role`, {
      method: "PUT",
      body: { role },
    }),
};

// Competencies
export const competencies = {
  list: () => request<{ competencies: any[] }>("/api/competencies"),
  create: (data: { name: string; description: string }) =>
    request<{ competency: any }>("/api/competencies", {
      method: "POST",
      body: data,
    }),
  update: (id: string, data: { name: string; description: string }) =>
    request<{ competency: any }>(`/api/competencies/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/competencies/${id}`, { method: "DELETE" }),
};

// Games
export const games = {
  list: () => request<{ games: any[] }>("/api/games"),
  getById: (id: string) => request<{ game: any }>(`/api/games/${id}`),
  create: (data: any) =>
    request<{ game: any }>("/api/games", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    request<{ game: any }>(`/api/games/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/games/${id}`, { method: "DELETE" }),
};

// Sessions
export const sessions = {
  create: (data: { helperId: string; gameId: string }) =>
    request<{ session: any }>("/api/sessions", {
      method: "POST",
      body: data,
    }),
  complete: (id: string) =>
    request<{ session: any }>(`/api/sessions/${id}/complete`, { method: "PUT" }),
  my: () => request<{ sessions: any[] }>("/api/sessions/my"),
  all: () => request<{ sessions: any[] }>("/api/sessions"),
};

// Notes
export const notes = {
  list: () => request<{ notes: any[] }>("/api/notes"),
  create: (data: { text: string }) =>
    request<{ note: any }>("/api/notes", { method: "POST", body: data }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/notes/${id}`, { method: "DELETE" }),
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
  questions: () => request<{ questions: any[]; dimensions: string[] }>("/api/test/questions"),
  submit: (answers: { questionId: number; value: number }[]) =>
    request<{
      mbtiType: string;
      dimensions: any;
      description: { title: string; description: string; strengths: string[]; growth: string[] };
    }>("/api/test/submit", {
      method: "POST",
      body: { answers },
    }),
  result: () =>
    request<{
      mbtiType: string;
      description: { title: string; description: string; strengths: string[]; growth: string[] };
    }>("/api/test/result"),
};