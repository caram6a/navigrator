# НавИГРАтор (Navigrator)

Платформа для развития личностных навыков через игры с MBTI-типированием.

## Технологический стек

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (JSON Web Tokens)
- **Themes**: next-themes (Light / Dark / System)
- **Containerization**: Docker + Docker Compose

## Быстрый старт

### 1. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Настройка базы данных (локально)

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed  # Заполнить тестовыми данными
```

### 3. Запуск через Docker

```bash
docker-compose up -d
```

Это создаст три контейнера:
- **PostgreSQL** (порт 5432)
- **Backend API** (порт 4000)
- **Frontend** (порт 3000)

### 4. Локальный запуск

```bash
# Backend
cd backend
npm run dev  # http://localhost:4000

# Frontend
cd frontend
npm run dev  # http://localhost:3000
```

## Структура проекта

```
project/
├── frontend/               # Клиентская часть (Next.js/React)
│   ├── src/
│   │   ├── app/            # Страницы и роутинг
│   │   ├── components/     # UI-компоненты
│   │   ├── lib/            # Утилиты, API-клиенты
│   │   └── styles/         # Глобальные стили
│   ├── public/             # Статика
│   ├── package.json
│   └── Dockerfile
├── backend/                # Серверная часть
│   ├── src/
│   │   ├── api/            # Эндпоинты
│   │   ├── lib/            # Prisma client
│   │   ├── middleware/     # Auth middleware
│   │   └── seed.ts         # Начальные данные
│   ├── prisma/
│   │   └── schema.prisma   # Схема БД
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env / .env.example
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация (первый пользователь — admin)
- `POST /api/auth/login` — Вход
- `GET /api/auth/me` — Текущий пользователь

### Users
- `GET /api/users` — Список пользователей (admin/leader)
- `GET /api/users/helpers` — Список верифицированных helpers
- `GET /api/users/:id` — Профиль пользователя
- `PUT /api/users/:id/verify` — Верифицировать helper (admin/leader)
- `PUT /api/users/:id/role` — Изменить роль (admin)

### Competencies
- `GET /api/competencies` — Список компетенций
- `POST /api/competencies` — Создать (admin/leader)
- `PUT /api/competencies/:id` — Обновить (admin/leader)
- `DELETE /api/competencies/:id` — Удалить (admin)

### Games
- `GET /api/games` — Список игр
- `GET /api/games/:id` — Детали игры
- `POST /api/games` — Создать (admin/leader)
- `PUT /api/games/:id` — Обновить (admin/leader)
- `DELETE /api/games/:id` — Удалить (admin)

### Sessions
- `POST /api/sessions` — Создать сессию
- `PUT /api/sessions/:id/complete` — Завершить сессию
- `GET /api/sessions/my` — Мои сессии
- `GET /api/sessions` — Все сессии (admin/leader)

### Test (MBTI)
- `GET /api/test/questions` — Получить 32 вопроса
- `POST /api/test/submit` — Отправить ответы, получить результат
- `GET /api/test/result` — Последний результат

## Роли

| Роль | Описание |
|------|----------|
| **Admin** | Полный доступ, управление пользователями и контентом |
| **Leader** | Управление играми, компетенциями, верификация helpers |
| **Helper** | Помощник игроков (требует верификации) |
| **Player** | Прохождение тестов, игры, развитие навыков |

## MBTI тест

32 вопроса с биполярными шкалами (1-7). Результат включает:
- Тип личности (ENFP, INTJ, и т.д.)
- Баллы по 4 измерениям (EI, SN, TF, JP)
- Проценты по каждой шкале
- Развёрнутое описание: характеристика, сильные стороны, зоны роста