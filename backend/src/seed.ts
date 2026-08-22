import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create MBTI competencies
  const competencies = await Promise.all([
    prisma.competency.create({
      data: {
        name: 'MBTI-EI',
        description: 'Шкала Экстраверсия (E) - Интроверсия (I). Определяет, откуда человек черпает энергию: из внешнего мира общения или внутреннего мира размышлений.',
      },
    }),
    prisma.competency.create({
      data: {
        name: 'MBTI-SN',
        description: 'Шкала Сенсорика (S) - Интуиция (N). Определяет, как человек обрабатывает информацию: через конкретные детали или абстрактные концепции.',
      },
    }),
    prisma.competency.create({
      data: {
        name: 'MBTI-TF',
        description: 'Шкала Логика (T) - Чувства (F). Определяет, как человек принимает решения: на основе логического анализа или эмоциональной оценки.',
      },
    }),
    prisma.competency.create({
      data: {
        name: 'MBTI-JP',
        description: 'Шкала Суждение (J) - Восприятие (P). Определяет, предпочитает ли человек структурированный образ жизни с планированием или гибкий и спонтанный.',
      },
    }),
  ]);

  console.log(`✅ Created ${competencies.length} competencies`);

  // Create sample games
  const games = await Promise.all([
    prisma.game.create({
      data: {
        title: 'Лабиринт стратегий',
        description: 'Пошаговая стратегическая игра, требующая планирования и анализа. Игроки управляют ресурсами и принимают долгосрочные решения.',
        complexity: 'hard',
        competencyScores: {
          create: [
            { competencyId: competencies[0].id, score: 6 },
            { competencyId: competencies[1].id, score: 8 },
            { competencyId: competencies[2].id, score: 7 },
            { competencyId: competencies[3].id, score: 9 },
          ],
        },
      },
    }),
    prisma.game.create({
      data: {
        title: 'Дипломат',
        description: 'Коммуникативная игра, где нужно находить общий язык с разными персонажами, вести переговоры и разрешать конфликты.',
        complexity: 'medium',
        competencyScores: {
          create: [
            { competencyId: competencies[0].id, score: 9 },
            { competencyId: competencies[1].id, score: 6 },
            { competencyId: competencies[2].id, score: 8 },
            { competencyId: competencies[3].id, score: 5 },
          ],
        },
      },
    }),
    prisma.game.create({
      data: {
        title: 'Творческий хаос',
        description: 'Игра на генерацию идей и креативное мышление. Участники решают нестандартные задачи в условиях ограниченного времени.',
        complexity: 'easy',
        competencyScores: {
          create: [
            { competencyId: competencies[0].id, score: 7 },
            { competencyId: competencies[1].id, score: 9 },
            { competencyId: competencies[2].id, score: 4 },
            { competencyId: competencies[3].id, score: 8 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${games.length} sample games`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });