import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { authRouter } from "./api/auth";
import { usersRouter } from "./api/users";
import { competenciesRouter } from "./api/competencies";
import { gamesRouter } from "./api/games";
import { sessionsRouter } from "./api/sessions";
import { testRouter } from "./api/test";
import { notesRouter } from "./api/notes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://navigrator.vercel.app",
    "https://navigrator-git-master-caram6as-projects.vercel.app",
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/competencies", competenciesRouter);
app.use("/api/games", gamesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/test", testRouter);
app.use("/api/notes", notesRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});