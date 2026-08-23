import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const testRouter = Router();

const DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
type Dimension = typeof DIMENSIONS[number];

const MBTI_QUESTIONS = [
  { id: 1, text: 'Вы предпочитаете проводить время в компании людей или в одиночестве?', low: 'E', high: 'I' },
  { id: 2, text: 'Вы больше сосредоточены на внешнем мире или на своих внутренних мыслях?', low: 'E', high: 'I' },
  { id: 3, text: 'Вам легче работать в команде или самостоятельно?', low: 'E', high: 'I' },
  { id: 4, text: 'Вы чувствуете прилив энергии от общения с людьми или от уединения?', low: 'E', high: 'I' },
  { id: 5, text: 'Вы обращаете больше внимания на конкретные детали или на общую картину?', low: 'S', high: 'N' },
  { id: 6, text: 'Вы доверяете больше своему опыту или интуиции?', low: 'S', high: 'N' },
  { id: 7, text: 'Вы предпочитаете чёткие инструкции или возможность импровизировать?', low: 'S', high: 'N' },
  { id: 8, text: 'Вы лучше запоминаете факты или идеи?', low: 'S', high: 'N' },
  { id: 9, text: 'Принимая решения, вы опираетесь на логику или на чувства?', low: 'T', high: 'F' },
  { id: 10, text: 'Для вас важнее справедливость или гармония в отношениях?', low: 'T', high: 'F' },
  { id: 11, text: 'Вы чаще говорите то, что думаете, или то, что хотели бы услышать другие?', low: 'T', high: 'F' },
  { id: 12, text: 'В споре вы отстаиваете факты или стараетесь сохранить мир?', low: 'T', high: 'F' },
  { id: 13, text: 'Вы предпочитаете планировать всё заранее или действовать по обстоятельствам?', low: 'J', high: 'P' },
  { id: 14, text: 'Вам комфортнее, когда всё организовано, или когда есть свобода выбора?', low: 'J', high: 'P' },
  { id: 15, text: 'Вы любите завершать начатое или предпочитаете оставлять возможности открытыми?', low: 'J', high: 'P' },
  { id: 16, text: 'Вас больше устраивает расписание или спонтанность?', low: 'J', high: 'P' },
  { id: 17, text: 'Вы чувствуете усталость после долгого общения с большим количеством людей?', low: 'E', high: 'I' },
  { id: 18, text: 'Вы предпочитаете быть в центре внимания или оставаться в тени?', low: 'E', high: 'I' },
  { id: 19, text: 'Вас больше привлекают абстрактные концепции или практические применения?', low: 'S', high: 'N' },
  { id: 20, text: 'Вы любите фантазировать о будущем или предпочитаете жить настоящим?', low: 'S', high: 'N' },
  { id: 21, text: 'Вы считаете себя скорее рациональным или эмоциональным человеком?', low: 'T', high: 'F' },
  { id: 22, text: 'Вам важно, чтобы решения были объективными или учитывали чувства других?', low: 'T', high: 'F' },
  { id: 23, text: 'Вы обычно говорите прямо или смягчаете свои слова?', low: 'T', high: 'F' },
  { id: 24, text: 'Вы гордитесь своей объективностью или своей эмпатией?', low: 'T', high: 'F' },
  { id: 25, text: 'Вы предпочитаете чёткие дедлайны или свободный график?', low: 'J', high: 'P' },
  { id: 26, text: 'Вы чувствуете себя лучше, когда следует расписанию, или когда оставляете пространство для спонтанности?', low: 'J', high: 'P' },
  { id: 27, text: 'Вы предпочитаете иметь чёткий план или общее направление?', low: 'J', high: 'P' },
  { id: 28, text: 'Вас успокаивает порядок или вы чувствуете себя скованно в строгих рамках?', low: 'J', high: 'P' },
  { id: 29, text: 'После вечеринки вы чувствуете прилив энергии или хотите отдохнуть?', low: 'E', high: 'I' },
  { id: 30, text: 'Вы предпочитаете проводить выходные в компании друзей или в спокойной обстановке?', low: 'E', high: 'I' },
  { id: 31, text: 'Вас больше вдохновляют реальные достижения или новые возможности?', low: 'S', high: 'N' },
  { id: 32, text: 'Вы больше цените конкретные результаты или общее понимание?', low: 'S', high: 'N' },
];

const MBTI_DESCRIPTIONS: Record<string, any> = {
  "ENFJ": { title: "Наставник", description: "Харизматичный лидер, вдохновляющий других. Умеет находить общий язык с людьми и направлять их к общим целям.", strengths: ["Эмпатия", "Коммуникабельность", "Организованность", "Вдохновение"], growth: ["Излишняя забота о мнении других", "Склонность к выгоранию", "Трудности с принятием критики"] },
  "ENFP": { title: "Борец", description: "Творческий энтузиаст с богатым воображением. Видит возможности во всём и заражает энергией окружающих.", strengths: ["Креативность", "Энергичность", "Социальность", "Адаптивность"], growth: ["Неорганизованность", "Излишняя эмоциональность", "Трудности с рутиной"] },
  "ENTJ": { title: "Командир", description: "Решительный стратег, рождённый лидер. Четко видит цели и ведёт команду к их достижению.", strengths: ["Лидерство", "Стратегическое мышление", "Решительность", "Эффективность"], growth: ["Нетерпимость", "Излишняя требовательность", "Эмоциональная холодность"] },
  "ENTP": { title: "Полемист", description: "Изобретательный интеллектуал, любящий дискуссии. Генерирует новые идеи и находит нестандартные решения.", strengths: ["Остроумие", "Креативность", "Аналитические способности", "Гибкость мышления"], growth: ["Склонность к спорам", "Непостоянство", "Пренебрежение деталями"] },
  "ESFJ": { title: "Консул", description: "Заботливый и общительный организатор. Ценит традиции и создаёт гармонию вокруг себя.", strengths: ["Заботливость", "Организованность", "Практичность", "Надёжность"], growth: ["Излишняя зависимость от одобрения", "Консервативность", "Трудности с переменами"] },
  "ESFP": { title: "Развлекатель", description: "Энергичный артист, живущий здесь и сейчас. Умеет радоваться жизни и заражать позитивом.", strengths: ["Жизнерадостность", "Общительность", "Смелость", "Практичность"], growth: ["Импульсивность", "Неорганизованность", "Избегание ответственности"] },
  "ESTJ": { title: "Менеджер", description: "Надёжный и ответственный организатор. Ценит порядок, структуру и эффективность во всём.", strengths: ["Организованность", "Ответственность", "Честность", "Трудолюбие"], growth: ["Негибкость", "Излишняя строгость", "Нетерпеливость"] },
  "ESTP": { title: "Делец", description: "Энергичный и смелый предприниматель. Умеет быстро реагировать и добиваться результатов.", strengths: ["Смелость", "Практичность", "Адаптивность", "Убедительность"], growth: ["Импульсивность", "Склонность к риску", "Нетерпеливость"] },
  "INFJ": { title: "Активист", description: "Мудрый и целеустремлённый идеалист. Видит глубину в людях и стремится к позитивным изменениям.", strengths: ["Интуиция", "Эмпатия", "Целеустремлённость", "Креативность"], growth: ["Перфекционизм", "Склонность к выгоранию", "Излишняя чувствительность"] },
  "INFP": { title: "Посредник", description: "Мечтатель и идеалист с богатым внутренним миром. Ценит искренность и стремится к самовыражению.", strengths: ["Креативность", "Эмпатия", "Искренность", "Гибкость"], growth: ["Излишняя мечтательность", "Трудности с конфликтами", "Склонность к самокритике"] },
  "INTJ": { title: "Архитектор", description: "Стратег с аналитическим складом ума. Способен видеть далёкие перспективы и воплощать сложные планы.", strengths: ["Стратегическое мышление", "Независимость", "Аналитические способности", "Целеустремлённость"], growth: ["Излишняя критичность", "Эмоциональная закрытость", "Перфекционизм"] },
  "INTP": { title: "Учёный", description: "Любознательный мыслитель, стремящийся понять законы мироздания. Глубокий аналитик и теоретик.", strengths: ["Аналитический ум", "Творческое решение проблем", "Объективность", "Любознательность"], growth: ["Социальная неловкость", "Излишняя теоретизация", "Прокрастинация"] },
  "ISFJ": { title: "Защитник", description: "Надёжный и внимательный человек, готовый поддерживать других. Ценит стабильность и традиции.", strengths: ["Надёжность", "Внимательность к деталям", "Терпение", "Практичность"], growth: ["Трудности с переменами", "Излишняя скромность", "Склонность к самоограничению"] },
  "ISFP": { title: "Художник", description: "Творческий и чувствительный человек с особым восприятием красоты. Ценит свободу и самовыражение.", strengths: ["Творческие способности", "Чуткость", "Гибкость", "Эстетическое чутьё"], growth: ["Избегание ответственности", "Трудности с планированием", "Излишняя ранимость"] },
  "ISTJ": { title: "Администратор", description: "Надёжный и организованный человек, который всегда выполняет обещания. Столп порядка и стабильности.", strengths: ["Ответственность", "Надёжность", "Честность", "Организованность"], growth: ["Негибкость", "Излишний консерватизм", "Трудности с абстрактными идеями"] },
  "ISTP": { title: "Виртуоз", description: "Практичный и умелый мастер, умеющий разбираться в механизмах. Склонен к действию, а не к словам.", strengths: ["Практичность", "Аналитические способности", "Адаптивность", "Умение работать руками"], growth: ["Излишняя замкнутость", "Склонность к риску", "Трудности с долгосрочным планированием"] },
};

// POST /api/test/submit — submit MBTI test answers
testRouter.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Необходимо передать answers' });
    }
    let e = 0, i = 0, s = 0, n = 0, t = 0, f = 0, j = 0, p = 0;
    MBTI_QUESTIONS.forEach(q => {
      const v = answers[q.id] || 0;
      if (v <= 4) {
        if (q.low === 'E') e += 4;
        if (q.low === 'I') i += 4;
        if (q.low === 'S') s += 4;
        if (q.low === 'N') n += 4;
        if (q.low === 'T') t += 4;
        if (q.low === 'F') f += 4;
        if (q.low === 'J') j += 4;
        if (q.low === 'P') p += 4;
      } else {
        if (q.high === 'E') e += 4;
        if (q.high === 'I') i += 4;
        if (q.high === 'S') s += 4;
        if (q.high === 'N') n += 4;
        if (q.high === 'T') t += 4;
        if (q.high === 'F') f += 4;
        if (q.high === 'J') j += 4;
        if (q.high === 'P') p += 4;
      }
    });
    const mbtiType = (e >= i ? 'E' : 'I') + (s >= n ? 'S' : 'N') + (t >= f ? 'T' : 'F') + (j >= p ? 'J' : 'P');
    const percentages = {
      E: e + i > 0 ? Math.round((e / (e + i)) * 100) : 0,
      I: e + i > 0 ? Math.round((i / (e + i)) * 100) : 0,
      S: s + n > 0 ? Math.round((s / (s + n)) * 100) : 0,
      N: s + n > 0 ? Math.round((n / (s + n)) * 100) : 0,
      T: t + f > 0 ? Math.round((t / (t + f)) * 100) : 0,
      F: t + f > 0 ? Math.round((f / (t + f)) * 100) : 0,
      J: j + p > 0 ? Math.round((j / (j + p)) * 100) : 0,
      P: j + p > 0 ? Math.round((p / (j + p)) * 100) : 0,
    };
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { mbtiType },
    });
    const existingCompetencies = await prisma.userCompetency.findMany({
      where: { userId: req.user!.id },
    });
    const dimensionValues = {
      EI: (e + i) > 0 ? Math.round((Math.max(e, i) / (e + i)) * 100) : 0,
      SN: (s + n) > 0 ? Math.round((Math.max(s, n) / (s + n)) * 100) : 0,
      TF: (t + f) > 0 ? Math.round((Math.max(t, f) / (t + f)) * 100) : 0,
      JP: (j + p) > 0 ? Math.round((Math.max(j, p) / (j + p)) * 100) : 0,
    };
    for (const [dim, val] of Object.entries(dimensionValues)) {
      const existingComp = await prisma.competency.findFirst({
        where: { name: MBTI- },
      });
      if (existingComp) {
        const existing = existingCompetencies.find(uc => uc.competencyId === existingComp.id);
        if (existing) {
          if (val > existing.value) {
            await prisma.userCompetency.update({
              where: { id: existing.id },
              data: { value: val, testDate: new Date() },
            });
          }
        } else {
          await prisma.userCompetency.create({
            data: {
              userId: req.user!.id,
              competencyId: existingComp.id,
              value: val,
            },
          });
        }
      }
    }
    const desc = MBTI_DESCRIPTIONS[mbtiType] || {
      title: mbtiType,
      description: 'Описание недоступно.',
      strengths: [],
      growth: [],
    };
    res.json({
      mbtiType,
      dimensions: {
        EI: { value: mbtiType[0], dominant: mbtiType[0], score: dimensionValues.EI, E: percentages.E, I: percentages.I },
        SN: { value: mbtiType[1], dominant: mbtiType[1], score: dimensionValues.SN, S: percentages.S, N: percentages.N },
        TF: { value: mbtiType[2], dominant: mbtiType[2], score: dimensionValues.TF, T: percentages.T, F: percentages.F },
        JP: { value: mbtiType[3], dominant: mbtiType[3], score: dimensionValues.JP, J: percentages.J, P: percentages.P },
      },
      description: desc,
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/test/result — получить последний результат
testRouter.get('/result', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { mbtiType: true },
    });
    if (!user?.mbtiType) {
      return res.status(404).json({ error: 'Тест ещё не пройден' });
    }
    const desc = MBTI_DESCRIPTIONS[user.mbtiType] || {
      title: user.mbtiType,
      description: 'Описание недоступно.',
      strengths: [],
      growth: [],
    };
    res.json({
      mbtiType: user.mbtiType,
      description: desc,
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/test/save — сохранить результат теста (mbti или visual)
testRouter.post('/save', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { testType, result } = req.body;
    if (!testType || !['mbti', 'visual'].includes(testType)) {
      return res.status(400).json({ error: 'Неверный тип теста. Допустимые: mbti, visual' });
    }
    if (!result) {
      return res.status(400).json({ error: 'Необходимо передать result' });
    }
    const testResult = await prisma.testResult.create({
      data: {
        userId: req.user!.id,
        testType,
        result: result as any,
      },
    });
    res.json({ testResult });
  } catch (error) {
    console.error('Save test result error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/test/results — получить все результаты тестов пользователя
testRouter.get('/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ results });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/test/results/:type — получить результаты теста по типу
testRouter.get('/results/:type', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    if (!['mbti', 'visual'].includes(type)) {
      return res.status(400).json({ error: 'Неверный тип теста. Допустимые: mbti, visual' });
    }
    const results = await prisma.testResult.findMany({
      where: { userId: req.user!.id, testType: type },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ results });
  } catch (error) {
    console.error('Get test results by type error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});
