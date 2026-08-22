export function seedUsers() {
  // Принудительно очищаем всех пользователей при загрузке
  // чтобы избавиться от дубликатов
  localStorage.removeItem("users");
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("guestTestResults");
  localStorage.removeItem("gameSessions_guest");

  // Создаём только одного пользователя — админа
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