import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const gamesRouter = Router();

const gameSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  complexity: z.enum(['easy', 'medium', 'hard']),
  competencyScores: z.array(z.object({
    competencyId: z.string(),
    score: z.number().min(1).max(10),
  })),
});

// GET /api/games
gamesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      include: {
        competencyScores: {
          include: { competency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/games/:id
gamesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        competencyScores: {
          include: { competency: true },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/games (admin/leader only)
gamesRouter.post('/', authenticate, requireRole('admin', 'leader'), async (req: AuthRequest, res: Response) => {
  try {
    const data = gameSchema.parse(req.body);

    const game = await prisma.game.create({
      data: {
        title: data.title,
        description: data.description,
        complexity: data.complexity,
        competencyScores: {
          create: data.competencyScores.map((cs) => ({
            competencyId: cs.competencyId,
            score: cs.score,
          })),
        },
      },
      include: {
        competencyScores: {
          include: { competency: true },
        },
      },
    });

    res.status(201).json({ game });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
    }
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/games/:id (admin/leader only)
gamesRouter.put('/:id', authenticate, requireRole('admin', 'leader'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = gameSchema.parse(req.body);

    // Delete old competency scores and create new ones
    await prisma.gameCompetencyScore.deleteMany({ where: { gameId: id } });

    const game = await prisma.game.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        complexity: data.complexity,
        competencyScores: {
          create: data.competencyScores.map((cs) => ({
            competencyId: cs.competencyId,
            score: cs.score,
          })),
        },
      },
      include: {
        competencyScores: {
          include: { competency: true },
        },
      },
    });

    res.json({ game });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
    }
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/games/:id (admin only)
gamesRouter.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.game.delete({ where: { id } });
    res.json({ message: 'Игра удалена' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});