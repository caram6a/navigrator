import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const competenciesRouter = Router();

const competencySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
});

// GET /api/competencies
competenciesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const competencies = await prisma.competency.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ competencies });
  } catch (error) {
    console.error('Get competencies error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/competencies (admin/leader only)
competenciesRouter.post('/', authenticate, requireRole('admin', 'leader'), async (req: AuthRequest, res: Response) => {
  try {
    const data = competencySchema.parse(req.body);

    const competency = await prisma.competency.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    res.status(201).json({ competency });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
    }
    console.error('Create competency error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/competencies/:id (admin/leader only)
competenciesRouter.put('/:id', authenticate, requireRole('admin', 'leader'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = competencySchema.parse(req.body);

    const competency = await prisma.competency.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    res.json({ competency });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
    }
    console.error('Update competency error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/competencies/:id (admin only)
competenciesRouter.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.competency.delete({ where: { id } });
    res.json({ message: 'Компетенция удалена' });
  } catch (error) {
    console.error('Delete competency error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});