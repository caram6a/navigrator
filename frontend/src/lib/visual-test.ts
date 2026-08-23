// ============================================================
// Визуально-ассоциативный тест личности (80 вопросов)
// 12 типов фигур, 10 шкал личности
// ============================================================

// ---- Шкалы ----
export interface ScaleDef {
  id: string;
  name: string;
  leftLabel: string;   // левая сторона (1-2 балла)
  rightLabel: string;  // правая сторона (6-7 баллов)
  leftDesc: string;
  rightDesc: string;
  leftShapes: string[];   // какие фигуры тянут влево
  rightShapes: string[];  // какие фигуры тянут вправо
}

export const SCALES: ScaleDef[] = [
  { id: "EI", name: "Энергия / Социальность",
    leftLabel: "Экстраверсия", rightLabel: "Интроверсия",
    leftDesc: "Черпаешь энергию в общении, активен, открыт", rightDesc: "Черпаешь энергию в уединении, сосредоточен, сдержан",
    leftShapes: ["circle", "zigzag", "oval"], rightShapes: ["square", "rhombus", "pentagon"] },
  { id: "SN", name: "Восприятие информации",
    leftLabel: "Интуиция", rightLabel: "Сенсорика",
    leftDesc: "Видишь общую картину, фантазируешь, смотришь в будущее", rightDesc: "Фокусируешься на деталях, фактах, настоящем моменте",
    leftShapes: ["zigzag", "circle", "oval"], rightShapes: ["square", "triangle", "rect"] },
  { id: "TF", name: "Принятие решений",
    leftLabel: "Логика", rightLabel: "Чувства",
    leftDesc: "Руководствуешься анализом, принципами, объективностью", rightDesc: "Руководствуешься эмоциями, ценностями, гармонией",
    leftShapes: ["triangle", "square", "rect"], rightShapes: ["circle", "zigzag", "oval"] },
  { id: "JP", name: "Структура жизни",
    leftLabel: "Организованность", rightLabel: "Гибкость",
    leftDesc: "Любишь порядок, планы, предсказуемость", rightDesc: "Любишь спонтанность, свободу, адаптацию",
    leftShapes: ["square", "pentagon", "rect"], rightShapes: ["zigzag", "circle", "oval"] },
  { id: "VS", name: "Практичность / Идеи",
    leftLabel: "Визионерство", rightLabel: "Реализм",
    leftDesc: "Генерируешь идеи, мечтаешь, думаешь о возможностях", rightDesc: "Смотришь на вещи реалистично, практичен, приземлён",
    leftShapes: ["zigzag", "rhombus", "oval"], rightShapes: ["square", "triangle", "rect"] },
  { id: "CR", name: "Новаторство",
    leftLabel: "Креативность", rightLabel: "Консерватизм",
    leftDesc: "Любишь новое, эксперименты, нестандартные решения", rightDesc: "Ценишь традиции, проверенные методы, стабильность",
    leftShapes: ["zigzag", "circle", "oval"], rightShapes: ["square", "pentagon", "rect"] },
  { id: "LD", name: "Лидерство",
    leftLabel: "Лидерство", rightLabel: "Поддержка",
    leftDesc: "Ведёшь за собой, принимаешь решения, берёшь ответственность", rightDesc: "Поддерживаешь других, работаешь в команде, избегаешь конфликтов",
    leftShapes: ["triangle", "rhombus", "rect"], rightShapes: ["circle", "square", "oval"] },
  { id: "AN", name: "Ум / Сердце",
    leftLabel: "Аналитика", rightLabel: "Эмпатия",
    leftDesc: "Анализируешь, ищешь закономерности, объективен", rightDesc: "Чувствуешь других, сопереживаешь, ценишь отношения",
    leftShapes: ["square", "triangle", "rect"], rightShapes: ["circle", "zigzag", "oval"] },
  { id: "AD", name: "Адаптивность",
    leftLabel: "Адаптивность", rightLabel: "Стабильность",
    leftDesc: "Легко приспосабливаешься, любишь перемены, гибок", rightDesc: "Ценишь постоянство, надёжность, предпочитаешь рутину",
    leftShapes: ["zigzag", "circle", "oval"], rightShapes: ["square", "pentagon", "rect"] },
  { id: "AS", name: "Ассертивность",
    leftLabel: "Напористость", rightLabel: "Дипломатичность",
    leftDesc: "Уверен в себе, настойчив, добиваешься своего", rightDesc: "Тактичен, избегаешь конфронтации, ищешь компромиссы",
    leftShapes: ["triangle", "rhombus", "rect"], rightShapes: ["circle", "square", "oval"] },
];

// ---- Фигуры и их SVG-виды ----
export interface FigureDef {
  id: string;
  name: string;
  variants: ShapeVariant[];
}

export interface ShapeVariant {
  name: string;
  // Функция возвращает SVG path
  path: string;
}

const SVG_SIZE = 100;

export const FIGURE_DEFS: Record<string, FigureDef> = {
  circle: {
    id: "circle", name: "Круг",
    variants: [
      { name: "Идеальный круг", path: `<circle cx="50" cy="50" r="40" />` },
      { name: "Овал", path: `<ellipse cx="50" cy="50" rx="48" ry="32" />` },
      { name: "Сплюснутый овал", path: `<ellipse cx="50" cy="50" rx="35" ry="45" />` },
    ]
  },
  square: {
    id: "square", name: "Квадрат",
    variants: [
      { name: "Идеальный квадрат", path: `<rect x="10" y="10" width="80" height="80" />` },
      { name: "Скруглённый квадрат", path: `<rect x="12" y="12" width="76" height="76" rx="8" />` },
      { name: "Прямоугольник", path: `<rect x="10" y="20" width="80" height="60" />` },
    ]
  },
  triangle: {
    id: "triangle", name: "Треугольник",
    variants: [
      { name: "Равносторонний", path: `<polygon points="50,5 95,85 5,85" />` },
      { name: "Острый", path: `<polygon points="50,5 80,85 20,85" />` },
      { name: "Приплюснутый", path: `<polygon points="50,20 95,80 5,80" />` },
    ]
  },
  zigzag: {
    id: "zigzag", name: "Зигзаг",
    variants: [
      { name: "Острый зигзаг", path: `<polyline points="10,80 25,20 40,80 55,20 70,80 85,20 90,80" />` },
      { name: "Плавная волна", path: `<path d="M10,60 Q25,20 40,60 Q55,20 70,60 Q85,20 90,60" fill="none" stroke-width="6" />` },
      { name: "Зубцы", path: `<polyline points="10,80 20,20 30,80 40,20 50,80 60,20 70,80 80,20 90,80" />` },
    ]
  },
  rhombus: {
    id: "rhombus", name: "Ромб",
    variants: [
      { name: "Острый ромб", path: `<polygon points="50,5 85,50 50,95 15,50" />` },
      { name: "Тупой ромб", path: `<polygon points="50,15 85,50 50,85 15,50" />` },
      { name: "Квадратный ромб", path: `<polygon points="50,10 90,50 50,90 10,50" />` },
    ]
  },
  pentagon: {
    id: "pentagon", name: "Пятиугольник",
    variants: [
      { name: "Правильный", path: `<polygon points="50,5 95,35 80,85 20,85 5,35" />` },
      { name: "Вытянутый", path: `<polygon points="50,5 90,25 85,85 15,85 10,25" />` },
      { name: "Домик", path: `<polygon points="50,5 95,40 95,90 5,90 5,40" />` },
    ]
  },
  oval: {
    id: "oval", name: "Овал/Эллипс",
    variants: [
      { name: "Вытянутый по горизонтали", path: `<ellipse cx="50" cy="50" rx="45" ry="25" />` },
      { name: "Вытянутый по вертикали", path: `<ellipse cx="50" cy="50" rx="25" ry="45" />` },
      { name: "Капля", path: `<path d="M50,5 C75,30 80,60 65,80 C55,92 45,92 35,80 C20,60 25,30 50,5Z" />` },
    ]
  },
  rect: {
    id: "rect", name: "Прямоугольник",
    variants: [
      { name: "Горизонтальный", path: `<rect x="10" y="15" width="80" height="70" />` },
      { name: "Вертикальный", path: `<rect x="25" y="5" width="50" height="90" />` },
      { name: "Тонкая полоса", path: `<rect x="10" y="30" width="80" height="40" rx="4" />` },
    ]
  },
};

// Цвета для фигур
export const COLORS = [
  { fill: "#4A90D9", stroke: "#2B5EA7", name: "Синий" },
  { fill: "#E74C3C", stroke: "#C0392B", name: "Красный" },
  { fill: "#2ECC71", stroke: "#27AE60", name: "Зелёный" },
  { fill: "#F39C12", stroke: "#E67E22", name: "Оранжевый" },
  { fill: "#9B59B6", stroke: "#8E44AD", name: "Фиолетовый" },
  { fill: "#1ABC9C", stroke: "#16A085", name: "Бирюзовый" },
  { fill: "#E91E63", stroke: "#C2185B", name: "Розовый" },
  { fill: "#607D8B", stroke: "#455A64", name: "Серый" },
];

export const STROKE_WIDTHS = [2, 5];
export const SIZES = [0.8, 1.0, 1.2];

// ---- Генерация 80 вопросов ----
// Каждая шкала получает по 8 вопросов
// На каждом вопросе две фигуры — одна тянет влево, другая вправо
export interface TestQuestion {
  id: number;
  scaleId: string;        // какая шкала
  leftShape: string;      // id фигуры слева
  leftVariant: number;    // индекс варианта
  leftColor: typeof COLORS[0];
  leftFill: boolean;
  leftSize: number;
  rightShape: string;     // id фигуры справа
  rightVariant: number;
  rightColor: typeof COLORS[0];
  rightFill: boolean;
  rightSize: number;
}

// Детерминированная генерация на основе псевдо-случайности
function seededRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
}

export function generateQuestions(): TestQuestion[] {
  const questions: TestQuestion[] = [];
  const rand = seededRand(42); // фиксированный seed для воспроизводимости

  for (let s = 0; s < SCALES.length; s++) {
    const scale = SCALES[s];
    for (let q = 0; q < 8; q++) {
      const id = s * 8 + q + 1;

      // Выбираем случайную фигуру из левого набора
      const leftShapeId = scale.leftShapes[Math.floor(rand() * scale.leftShapes.length)];
      const leftVariant = Math.floor(rand() * FIGURE_DEFS[leftShapeId].variants.length);
      const leftColorIdx = Math.floor(rand() * COLORS.length);
      const leftFill = rand() > 0.5;
      const leftSizeIdx = Math.floor(rand() * SIZES.length);

      // Выбираем случайную фигуру из правого набора
      const rightShapeId = scale.rightShapes[Math.floor(rand() * scale.rightShapes.length)];
      let rightVariant = Math.floor(rand() * FIGURE_DEFS[rightShapeId].variants.length);
      let rightColorIdx = Math.floor(rand() * COLORS.length);
      const rightFill = rand() > 0.5;
      const rightSizeIdx = Math.floor(rand() * SIZES.length);

      // Гарантируем, что фигуры хотя бы чем-то отличаются
      if (leftShapeId === rightShapeId && leftVariant === rightVariant && leftColorIdx === rightColorIdx && leftFill === rightFill) {
        rightColorIdx = (leftColorIdx + 1 + Math.floor(rand() * (COLORS.length - 1))) % COLORS.length;
      }

      const leftColor = COLORS[leftColorIdx];
      const rightColor = COLORS[rightColorIdx];

      questions.push({
        id, scaleId: scale.id,
        leftShape: leftShapeId, leftVariant, leftColor, leftFill, leftSize: SIZES[leftSizeIdx],
        rightShape: rightShapeId, rightVariant, rightColor, rightFill, rightSize: SIZES[rightSizeIdx],
      });
    }
  }

  // Перемешиваем вопросы
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  // Переприсваиваем id
  questions.forEach((q, i) => q.id = i + 1);
  return questions;
}

// ---- Результаты ----
export interface VisualTestResult {
  scales: Record<string, { score: number; left: number; right: number }>;
  profile: string;
  description: string;
  date: string;
}

export function calculateResult(answers: Record<number, number>, questions: TestQuestion[]): VisualTestResult {
  const scaleScores: Record<string, { left: number; right: number }> = {};
  SCALES.forEach(s => { scaleScores[s.id] = { left: 0, right: 0 }; });

  Object.entries(answers).forEach(([qId, value]) => {
    const q = questions.find(q => q.id === parseInt(qId));
    if (!q) return;
    // value 1-7: 1-3 = левая фигура, 5-7 = правая фигура, 4 = нейтрально
    const direction = value <= 3 ? "left" : (value >= 5 ? "right" : null);
    if (direction) scaleScores[q.scaleId][direction]++;
  });

  const scales: Record<string, { score: number; left: number; right: number }> = {};
  const profileParts: string[] = [];

  SCALES.forEach(s => {
    const data = scaleScores[s.id];
    const total = data.left + data.right;
    const score = total === 0 ? 50 : Math.round((data.left / total) * 100);
    const dominant = data.left >= data.right ? s.leftLabel : s.rightLabel;
    scales[s.id] = { score, left: data.left, right: data.right };
    profileParts.push(dominant);
  });

  // Формируем профиль из трёх блоков
  const energyBlock = scales.EI.score > 50 ? scales.EI.score : 100 - scales.EI.score;
  const thinkingBlock = scales.SN.score > 50 ? scales.SN.score : 100 - scales.SN.score;
  const structureBlock = (scales.JP.score > 50 ? scales.JP.score : 100 - scales.JP.score);

  const isE = scales.EI.score >= 50;
  const isN = scales.SN.score >= 50;
  const isF = scales.TF.score < 50;
  const isP = scales.JP.score < 50;

  let typeCode = (isE ? "E" : "I") + (isN ? "N" : "S") + (isF ? "F" : "T") + (isP ? "P" : "J");

  // Дополнительные типы
  const isVS = scales.VS.score >= 50;
  const isCR = scales.CR.score >= 50;
  const isLD = scales.LD.score >= 50;
  const isAN = scales.AN.score >= 50;
  const isAD = scales.AD.score >= 50;
  const isAS = scales.AS.score >= 50;

  const extras = [];
  if (isVS) extras.push("Визионер"); else extras.push("Реалист");
  if (isCR) extras.push("Новатор"); else extras.push("Консерватор");
  if (isLD) extras.push("Лидер"); else extras.push("Помощник");
  if (isAN) extras.push("Аналитик"); else extras.push("Эмпат");
  if (isAD) extras.push("Адаптивный"); else extras.push("Стабильный");
  if (isAS) extras.push("Напористый"); else extras.push("Дипломатичный");

  const profile = `${extras.slice(0, 2).join("-")} (${typeCode})`;

  // Генерация описания
  const descParts: string[] = [];

  if (isE) descParts.push("Ты — экстравертная личность, черпающая энергию в общении и активных действиях. Тебе нравится быть в центре событий, заводить новые знакомства и делиться идеями.");
  else descParts.push("Ты — интровертная личность, предпочитающая уединение и глубокие размышления. Ты ценишь качество отношений над количеством и тщательно обдумываешь свои действия.");

  if (isN) descParts.push("Ты смотришь на мир через призму возможностей и идей. Твоя интуиция помогает тебе видеть то, что скрыто от других, и находить нестандартные решения.");
  else descParts.push("Ты реалист, который ценит факты и конкретику. Ты обращаешь внимание на детали, и твоя практичность помогает добиваться реальных результатов.");

  if (isF) descParts.push("При принятии решений ты руководствуешься чувствами и ценностями. Ты ставишь гармонию и отношения выше холодной логики.");
  else descParts.push("Ты принимаешь решения на основе логики и анализа. Объективность и рациональность — твои главные инструменты.");

  if (isP) descParts.push("Ты предпочитаешь гибкость и спонтанность жёстким планам. Ты открыт новому опыту и легко адаптируешься к изменениям.");
  else descParts.push("Ты ценишь порядок, структуру и предсказуемость. Планирование и организация помогают тебе чувствовать себя уверенно.");

  // Дополнительные черты
  if (isVS) descParts.push("Твой визионерский склад ума позволяет тебе генерировать смелые идеи и смотреть далеко вперёд.");
  else descParts.push("Твой реалистичный подход помогает тебе трезво оценивать ситуацию и не витать в облаках.");

  if (isCR) descParts.push("Ты — новатор, который не боится экспериментировать и пробовать новое. Рутина — не для тебя.");
  else descParts.push("Ты ценишь традиции и проверенные методы. Стабильность и надёжность для тебя важнее новизны.");

  if (isLD) descParts.push("У тебя есть лидерские качества: ты умеешь вести за собой, принимать решения и брать ответственность.");
  else descParts.push("Ты предпочитаешь поддерживать других и быть частью команды. Твоя сила — в умении слушать и помогать.");

  if (isAN) descParts.push("Твой аналитический ум позволяет тебе видеть закономерности, структурировать информацию и делать точные выводы.");
  else descParts.push("Твоя эмпатия и эмоциональный интеллект помогают тебе понимать людей и строить глубокие отношения.");

  if (isAD) descParts.push("Ты легко адаптируешься к новым условиям и не боишься перемен. Гибкость — твоё второе имя.");
  else descParts.push("Ты предпочитаешь стабильность и предсказуемость. Перемены даются тебе нелегко, но ты надёжен и последователен.");

  if (isAS) descParts.push("Ты уверен в себе и настойчив в достижении целей. Ты умеешь отстаивать свою позицию.");
  else descParts.push("Ты дипломатичен и тактичен, предпочитаешь искать компромиссы и избегать конфликтов.");

  return {
    scales,
    profile,
    description: descParts.join("\n\n"),
    date: new Date().toISOString(),
  };
}

export function saveResult(res: VisualTestResult) {
  // Сохраняем по userId, если есть currentUser
  let userId: string | null = null;
  try {
    const cu = localStorage.getItem("currentUser");
    if (cu) userId = JSON.parse(cu).id;
  } catch {}
  if (userId) {
    const key = "visualTestResults_" + userId;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(res);
    localStorage.setItem(key, JSON.stringify(existing));
  }
  // Всегда сохраняем и в гостевой ключ
  const guestKey = "guestVisualTestResults";
  const guestExisting = JSON.parse(localStorage.getItem(guestKey) || "[]");
  guestExisting.push(res);
  localStorage.setItem(guestKey, JSON.stringify(guestExisting));
}
