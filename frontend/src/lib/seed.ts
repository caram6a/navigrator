export function seedUsers() {
  const existing = localStorage.getItem("users");
  if (existing) {
    const users = JSON.parse(existing);
    // Если есть пользователи и нет дубликатов по email — ничего не делаем
    const emails = users.map((u: any) => u.email);
    const hasDuplicates = emails.length !== new Set(emails).size;
    if (!hasDuplicates) {
      // Просто проверяем что currentUser существует
      const token = localStorage.getItem("token");
      if (token && !localStorage.getItem("currentUser")) {
        const found = users.find((u: any) => u.id === token);
        if (found) {
          localStorage.setItem("currentUser", JSON.stringify(found));
        }
      }
      return;
    }
    // Если есть дубликаты — удаляем их, оставляем уникальных
    const unique: any[] = [];
    const seen = new Set<string>();
    for (const u of users) {
      if (!seen.has(u.email)) {
        seen.add(u.email);
        unique.push(u);
      }
    }
    localStorage.setItem("users", JSON.stringify(unique));
    return;
  }

  // Первый запуск — создаём пользователей
  const users: any[] = [];

  const defaultUser = {
    id: "1",
    name: "Илья",
    email: "kazak05ia@gmail.com",
    password: "122333",
    role: "admin",
    is_verified: true,
    mbti_type: null,
    created_at: new Date().toISOString(),
  };

  users.push(defaultUser);

  const fakeHelper = {
    id: "helper_fake_1",
    name: "Алексей Наставников",
    email: "alexey@navigrator.ru",
    password: "helper123",
    role: "helper",
    is_verified: true,
    mbti_type: "ENFJ",
    created_at: new Date().toISOString(),
  };

  users.push(fakeHelper);

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("token", defaultUser.id);
  localStorage.setItem("currentUser", JSON.stringify(defaultUser));
}