import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const sessionsRouter = Router();

// POST /api/sessions — создать сессию (игрок выбирает помощника и игру)
sessionsRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { helperId, gameId } = req.body;
    const playerId = req.user!.id;

    if (!helperId || !gameId) {
      return res.status(400).json({ error: 'helperId и gameId обязательны' });
    }

    // Verify helper exists and is verified
    const helper = await prisma.user.findUnique({
      where: { id: helperId },
    });

    if (!helper || helper.role !== 'helper' || !helper.isVerified) {
      return res.status(400).json({ error: 'Помощник не найден или не верифицирован' });
    }

    // Verify game exists
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return res.status(400).json({ error: 'Игра не найдена' });
    }

    const session = await prisma.session.create({
      data: {
        playerId,
        helperId,
        gameId,
        status: 'pending',
      },
      include: {
        player: { select: { id: true, name: true } },
        helper: { select: { id: true, name: true } },
        game: { select: { id: true, title: true, complexity: true } },
      },
    });

    res.status(201).json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/sessions/:id/complete — завершить сессию
sessionsRouter.put('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ error: 'Сессия не найдена' });
    }

    if (session.playerId !== req.user!.id && session.helperId !== req.user!.id) {
      return res.status(403).json({ error: 'Нет доступа к этой сессии' });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        status: 'completed',
        playedAt: new Date(),
      },
      include: {
        player: { select: { id: true, name: true } },
        helper: { select: { id: true, name: true } },
        game: { select: { id: true, title: true, complexity: true } },
      },
    });

    res.json({ session: updated });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/sessions/my — мои сессии
sessionsRouter.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { playerId: userId },
          { helperId: userId },
        ],
      },
      include: {
        player: { select: { id: true, name: true } },
        helper: { select: { id: true, name: true } },
        game: { select: { id: true, title: true, complexity: true } },
      },
      orderBy: { playedAt: 'desc' },
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/sessions — все сессии (admin/leader only)
import { requireRole } from '../middleware/auth';

sessionsRouter.get('/', authenticate, requireRole('admin', 'leader'), async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        player: { select: { id: true, name: true } },
        helper: { select: { id: true, name: true } },
        game: { select: { id: true, title: true, complexity: true } },
      },
      orderBy: { playedAt: 'desc' },
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});