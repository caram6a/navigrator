import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const usersRouter = Router();

// GET /api/users — список пользователей (только админ/лидер)
usersRouter.get('/', authenticate, requireRole('admin', 'leader'), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        mbtiType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/users/helpers — список helpers для выбора игроком
usersRouter.get('/helpers', async (_req: Request, res: Response) => {
  try {
    const helpers = await prisma.user.findMany({
      where: { role: 'helper', isVerified: true },
      select: { id: true, name: true, email: true, mbtiType: true },
    });
    res.json({ helpers });
  } catch (error) {
    console.error('Get helpers error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/users/:id/verify — подтвердить helper (админ/лидер)
usersRouter.put('/:id/verify', authenticate, requireRole('admin', 'leader'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role !== 'helper') {
      return res.status(400).json({ error: 'Только помощники могут быть верифицированы' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: { id: true, name: true, email: true, role: true, isVerified: true },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/users/:id/role — изменить роль (только админ)
usersRouter.put('/:id/role', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'leader', 'helper', 'player'].includes(role)) {
      return res.status(400).json({ error: 'Некорректная роль' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, isVerified: true },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/users/:id — профиль пользователя
usersRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        mbtiType: true,
        createdAt: true,
        competencies: {
          include: { competency: true },
          orderBy: { value: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});