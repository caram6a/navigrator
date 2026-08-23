import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// Получить все заметки
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
    });
    res.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Ошибка загрузки заметок" });
  }
});

// Создать заметку
router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Текст заметки обязателен" });
    }
    const note = await prisma.note.create({
      data: {
        text: text.trim(),
        authorId: (req as any).user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json({ note });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Ошибка создания заметки" });
  }
});

// Удалить заметку
router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.json({ message: "Заметка удалена" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Ошибка удаления заметки" });
  }
});

export const notesRouter = router;