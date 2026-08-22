export interface GameCompetency {
  name: string;
  score: number;
}

export interface Game {
  id: number;
  title: string;
  description: string;
  complexity: string;
  competencies: GameCompetency[];
}

export const GAMES: Game[] = [
  {
    id: 1,
    title: "Стратегия Империи",
    description: "Пошаговая стратегическая игра, где вы управляете развитием империи. Принимайте решения в условиях неопределённости, распределяйте ресурсы и ведите переговоры с другими игроками.",
    complexity: "Высокая",
    competencies: [
      { name: "Стратегическое мышление", score: 9 },
      { name: "Принятие решений", score: 8 },
      { name: "Управление ресурсами", score: 7 },
      { name: "Коммуникация", score: 6 },
      { name: "Анализ данных", score: 5 },
    ],
  },
  {
    id: 2,
    title: "Лабиринт Минотавра",
    description: "Кооперативная игра-головоломка, где команда ищет выход из лабиринта. Требует внимания к деталям, терпения и умения слушать других.",
    complexity: "Средняя",
    competencies: [
      { name: "Внимание к деталям", score: 8 },
      { name: "Работа в команде", score: 7 },
      { name: "Терпение", score: 6 },
      { name: "Пространственное мышление", score: 5 },
    ],
  },
  {
    id: 3,
    title: "Дипломатия",
    description: "Игра на переговоры и убеждение. Каждый игрок представляет страну и должен заключать союзы, убеждать оппонентов и достигать своих целей.",
    complexity: "Высокая",
    competencies: [
      { name: "Убеждение", score: 9 },
      { name: "Эмпатия", score: 8 },
      { name: "Стратегическое мышление", score: 7 },
      { name: "Управление конфликтами", score: 6 },
    ],
  },
  {
    id: 4,
    title: "Кодовое Имя",
    description: "Ассоциативная игра на понимание и логику. Один игрок даёт подсказки, остальные угадывают слова. Развивает креативность и ассоциативное мышление.",
    complexity: "Низкая",
    competencies: [
      { name: "Креативность", score: 7 },
      { name: "Логическое мышление", score: 6 },
      { name: "Коммуникация", score: 5 },
    ],
  },
];