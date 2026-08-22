export function seedUsers() {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  // Фейковый наставник (всегда добавляем, если его нет)
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

  const hasFake = users.some((u: any) => u.id === "helper_fake_1");
  if (!hasFake) {
    users.push(fakeHelper);
  }

  // Первый пользователь — админ
  if (users.length === 1) {
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
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("token", defaultUser.id);
    localStorage.setItem("currentUser", JSON.stringify(defaultUser));
  }

  localStorage.setItem("users", JSON.stringify(users));

  // Если есть token, но нет currentUser — восстанавливаем
  const token = localStorage.getItem("token");
  if (token && !localStorage.getItem("currentUser")) {
    const found = users.find((u: any) => u.id === token);
    if (found) {
      localStorage.setItem("currentUser", JSON.stringify(found));
    }
  }
}