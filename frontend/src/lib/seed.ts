export function seedUsers() {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  // Если есть пользователи — ничего не делаем, только проверяем непротиворечивость
  if (users.length > 0) {
    // Восстанавливаем currentUser если есть token но нет currentUser
    const token = localStorage.getItem("token");
    if (token && !localStorage.getItem("currentUser")) {
      const found = users.find((u: any) => u.id === token);
      if (found) {
        localStorage.setItem("currentUser", JSON.stringify(found));
      }
    }
    return;
  }

  // Первый запуск — создаём фейкового наставника и админа
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