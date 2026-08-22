import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const testRouter = Router();

// MBTI dimensions
const DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
type Dimension = typeof DIMENSIONS[number];

// 32 bipolar questions for OpenJung Core
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
  { id: 23, text: 'Вы чувствуете дискомфорт, когда планы меняются в последний момент?', low: 'J', high: 'P' },
  { id: 24, text: 'У вас на столе порядок или творческий беспорядок?', low: 'J', high: 'P' },
  { id: 25, text: 'Вы часто берёте инициативу в общении с незнакомцами?', low: 'E', high: 'I' },
  { id: 26, text: 'Вам нужно время на размышление перед ответом?', low: 'E', high: 'I' },
  { id: 27, text: 'Вы замечаете мелкие детали, которые другие упускают?', low: 'S', high: 'N' },
  { id: 28, text: 'Вам нравится искать скрытый смысл в происходящем?', low: 'S', high: 'N' },
  { id: 29, text: 'Вы легко можете поставить себя на место другого человека?', low: 'T', high: 'F' },
  { id: 30, text: 'В конфликтах вы стараетесь найти объективную истину?', low: 'T', high: 'F' },
  { id: 31, text: 'Вы предпочитаете чёткий план действий или импровизацию?', low: 'J', high: 'P' },
  { id: 32, text: 'Вам нравится, когда дни расписаны по часам?', low: 'J', high: 'P' },
];

// Descriptions for all 16 MBTI types
const MBTI_DESCRIPTIONS: Record<string, { title: string; description: string; strengths: string[]; growth: string[] }> = {
  'INTJ': {
    title: 'Стратег (INTJ)',
    description: 'Независимые, стратегические мыслители. INTJ обладают редким сочетанием аналитического ума и решимости. Они видят будущее не просто как продолжение настоящего, а как ландшафт возможностей, который можно спроектировать и построить.',
    strengths: ['Стратегическое мышление', 'Уверенность в своих решениях', 'Независимость', 'Высокие стандарты', 'Целеустремлённость'],
    growth: ['Могут быть слишком критичными', 'Склонны к перфекционизму', 'Игнорируют эмоции других', 'Трудности с выражением чувств'],
  },
  'INTP': {
    title: 'Логик (INTP)',
    description: 'Изобретательные, любознательные мыслители. INTP — вечные студенты, которые постоянно ищут новые знания и закономерности. Они обладают уникальной способностью видеть логические связи там, где другие их не замечают.',
    strengths: ['Аналитические способности', 'Креативность', 'Объективность', 'Любознательность', 'Открытость новому'],
    growth: ['Склонность к прокрастинации', 'Непереносимость рутины', 'Могут быть отстранёнными', 'Трудности с практической реализацией'],
  },
  'ENTJ': {
    title: 'Командир (ENTJ)',
    description: 'Харизматичные, решительные лидеры. ENTJ рождены для управления. Они видят потенциал в хаосе и обладают способностью организовывать людей и ресурсы для достижения амбициозных целей.',
    strengths: ['Лидерские качества', 'Эффективная организация', 'Стратегическое видение', 'Решительность', 'Харизма'],
    growth: ['Могут быть авторитарными', 'Нетерпимость к неэффективности', 'Игнорирование чувств подчинённых', 'Склонность перерабатывать'],
  },
  'ENTP': {
    title: 'Полемист (ENTP)',
    description: 'Изобретательные, дерзкие энтузиасты. ENTP — мастера интеллектуальных баталий. Они обожают новые идеи, дебаты и возможность посмотреть на проблему со всех сторон.',
    strengths: ['Остроумие', 'Интеллектуальная гибкость', 'Энтузиазм', 'Креативность', 'Умение убеждать'],
    growth: ['Могут быть спорщиками', 'Непостоянство', 'Склонность бросать начатое', 'Недостаток внимания к деталям'],
  },
  'INFJ': {
    title: 'Активист (INFJ)',
    description: 'Спокойные, мистические идеалисты. INFJ — редчайший тип личности. Они сочетают глубокую интуицию с искренним желанием сделать мир лучше. Их видение будущего — не просто фантазии, а план действий.',
    strengths: ['Глубокая интуиция', 'Эмпатия', 'Идеализм', 'Целеустремлённость', 'Творческое мышление'],
    growth: ['Склонность к выгоранию', 'Чрезмерная чувствительность', 'Перфекционизм', 'Избегание конфликтов'],
  },
  'INFP': {
    title: 'Посредник (INFP)',
    description: 'Творческие, чуткие альтруисты. INFP живут в мире идей и ценностей. Они обладают редкой способностью понимать эмоции других и стремятся к гармонии и смыслу во всём, что делают.',
    strengths: ['Эмпатия', 'Креативность', 'Искренность', 'Открытость', 'Идеализм'],
    growth: ['Чрезмерная идеализация', 'Склонность к самокритике', 'Трудности с практическими задачами', 'Избегание конфликтов'],
  },
  'ENFJ': {
    title: 'Тренер (ENFJ)',
    description: 'Харизматичные, вдохновляющие лидеры. ENFJ обладают природным даром объединять людей и вдохновлять их на достижение общих целей. Они видят потенциал в каждом человеке.',
    strengths: ['Лидерство', 'Коммуникабельность', 'Эмпатия', 'Организаторские способности', 'Оптимизм'],
    growth: ['Склонность к эмоциональному выгоранию', 'Чрезмерная забота о других', 'Трудности с принятием критики', 'Перфекционизм'],
  },
  'ENFP': {
    title: 'Борец (ENFP)',
    description: 'Свободные духом, энтузиастичные творцы. ENFP — источник вдохновения и энергии. Они видят мир как поле бесконечных возможностей и заражают других своим энтузиазмом.',
    strengths: ['Энтузиазм', 'Креативность', 'Коммуникабельность', 'Эмпатия', 'Оптимизм'],
    growth: ['Неорганизованность', 'Склонность отвлекаться', 'Чрезмерная эмоциональность', 'Трудности с рутиной'],
  },
  'ISTJ': {
    title: 'Администратор (ISTJ)',
    description: 'Надёжные, ответственные хранители традиций. ISTJ — это люди, на которых можно положиться. Они добросовестно выполняют свои обязанности и ценят порядок, структуру и предсказуемость.',
    strengths: ['Надёжность', 'Ответственность', 'Организованность', 'Внимание к деталям', 'Практичность'],
    growth: ['Сопротивление переменам', 'Излишняя rigidность', 'Трудности с абстрактными идеями', 'Недостаток гибкости'],
  },
  'ISFJ': {
    title: 'Защитник (ISFJ)',
    description: 'Заботливые, преданные хранители. ISFJ — личности с золотым сердцем. Они обладают редкой способностью замечать, что нужно другим, и готовы приложить все усилия, чтобы помочь.',
    strengths: ['Надёжность', 'Заботливость', 'Терпение', 'Практичность', 'Внимательность'],
    growth: ['Склонность к самопожертвованию', 'Трудности с отказами', 'Недооценка себя', 'Сопротивление переменам'],
  },
  'ESTJ': {
    title: 'Менеджер (ESTJ)',
    description: 'Эффективные, организованные лидеры. ESTJ — прирождённые управленцы. Они умеют наводить порядок, устанавливать правила и добиваться результатов.',
    strengths: ['Организованность', 'Лидерство', 'Практичность', 'Надёжность', 'Трудолюбие'],
    growth: ['Могут быть жёсткими', 'Сопротивление инновациям', 'Излишняя прямолинейность', 'Негибкость'],
  },
  'ESFJ': {
    title: 'Консул (ESFJ)',
    description: 'Дружелюбные, заботливые организаторы. ESFJ — душа компании. Они обладают природным талантом создавать уют, поддерживать традиции и заботиться о благополучии окружающих.',
    strengths: ['Коммуникабельность', 'Заботливость', 'Организованность', 'Ответственность', 'Практичность'],
    growth: ['Чрезмерная зависимость от мнения других', 'Склонность к беспокойству', 'Трудности с критикой', 'Избегание конфликтов'],
  },
  'ISTP': {
    title: 'Виртуоз (ISTP)',
    description: 'Практичные, наблюдательные мастеровые. ISTP — мастера инструментов и техники. Они обладают редкой способностью понимать, как работают механизмы, и находить нестандартные решения.',
    strengths: ['Практичность', 'Наблюдательность', 'Гибкость', 'Умение решать проблемы', 'Независимость'],
    growth: ['Склонность к риску', 'Непостоянство', 'Излишняя сдержанность', 'Трудности с планированием'],
  },
  'ISFP': {
    title: 'Артист (ISFP)',
    description: 'Творческие, чувствительные эстеты. ISFP — люди с тонким вкусом и богатым внутренним миром. Они выражают себя через искусство, стиль и действия, а не через слова.',
    strengths: ['Творчество', 'Чуткость', 'Эстетическое чутьё', 'Гибкость', 'Искренность'],
    growth: ['Излишняя скромность', 'Склонность к избеганию', 'Трудности с планированием', 'Чрезмерная чувствительность'],
  },
  'ESTP': {
    title: 'Делец (ESTP)',
    description: 'Энергичные, дерзкие деятели. ESTP — люди действия. Они живут здесь и сейчас, обладают острым умом и способностью быстро адаптироваться к любым обстоятельствам.',
    strengths: ['Энергичность', 'Практичность', 'Переговорные навыки', 'Адаптивность', 'Смелость'],
    growth: ['Склонность к риску', 'Нетерпеливость', 'Недостаток терпения к рутине', 'Прямолинейность'],
  },
  'ESFP': {
    title: 'Развлекатель (ESFP)',
    description: 'Спонтанные, жизнерадостные артисты. ESFP — душа любой компании. Они привносят радость, энергию и спонтанность в жизнь окружающих и обладают уникальной способностью наслаждаться каждым моментом.',
    strengths: ['Оптимизм', 'Коммуникабельность', 'Спонтанность', 'Творчество', 'Энтузиазм'],
    growth: ['Непостоянство', 'Избегание сложных тем', 'Трудности с планированием', 'Впечатлительность'],
  },
};

// GET /api/test/questions — получить вопросы
testRouter.get('/questions', (_req: Request, res: Response) => {
  res.json({
    questions: MBTI_QUESTIONS.map(q => ({
      id: q.id,
      text: q.text,
    })),
    dimensions: DIMENSIONS,
  });
});

// POST /api/test/submit — отправить ответы и получить результат
testRouter.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body; // Array of { questionId: number, value: number } (1-7 scale)

    if (!Array.isArray(answers) || answers.length !== 32) {
      return res.status(400).json({ error: 'Необходимо ответить на все 32 вопроса' });
    }

    // Calculate scores for each dimension
    const scores: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    answers.forEach((answer: { questionId: number; value: number }) => {
      const question = MBTI_QUESTIONS.find(q => q.id === answer.questionId);
      if (!question) return;

      const value = answer.value; // 1-7 scale
      // 1-2-3: low side; 5-6-7: high side; 4: neutral
      if (value < 4) {
        scores[question.low] += 4 - value;
      } else if (value > 4) {
        scores[question.high] += value - 4;
      }
    });

    // Determine MBTI type
    const e = scores.E;
    const i = scores.I;
    const s = scores.S;
    const n = scores.N;
    const t = scores.T;
    const f = scores.F;
    const j = scores.J;
    const p = scores.P;

    const mbtiType = [
      e >= i ? 'E' : 'I',
      s >= n ? 'S' : 'N',
      t >= f ? 'T' : 'F',
      j >= p ? 'J' : 'P',
    ].join('');

    // Calculate percentages for each dimension
    const eiTotal = e + i;
    const snTotal = s + n;
    const tfTotal = t + f;
    const jpTotal = j + p;

    const percentages = {
      E: eiTotal > 0 ? Math.round((e / eiTotal) * 100) : 0,
      I: eiTotal > 0 ? Math.round((i / eiTotal) * 100) : 0,
      S: snTotal > 0 ? Math.round((s / snTotal) * 100) : 0,
      N: snTotal > 0 ? Math.round((n / snTotal) * 100) : 0,
      T: tfTotal > 0 ? Math.round((t / tfTotal) * 100) : 0,
      F: tfTotal > 0 ? Math.round((f / tfTotal) * 100) : 0,
      J: jpTotal > 0 ? Math.round((j / jpTotal) * 100) : 0,
      P: jpTotal > 0 ? Math.round((p / jpTotal) * 100) : 0,
    };

    // Update user MBTI type
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { mbtiType },
    });

    // Check for existing competencies and update if needed
    const existingCompetencies = await prisma.userCompetency.findMany({
      where: { userId: req.user!.id },
    });

    const dimensionValues = {
      EI: (e + i) > 0 ? Math.round((Math.max(e, i) / (e + i)) * 100) : 0,
      SN: (s + n) > 0 ? Math.round((Math.max(s, n) / (s + n)) * 100) : 0,
      TF: (t + f) > 0 ? Math.round((Math.max(t, f) / (t + f)) * 100) : 0,
      JP: (j + p) > 0 ? Math.round((Math.max(j, p) / (j + p)) * 100) : 0,
    };

    // Update or create competency records
    for (const [dim, val] of Object.entries(dimensionValues)) {
      const existingComp = await prisma.competency.findFirst({
        where: { name: `MBTI-${dim}` },
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

    // Get description
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