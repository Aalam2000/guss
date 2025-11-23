import fastify from "fastify";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = fastify();

async function start() {
  // 1. Подключаем Prisma
  try {
    await prisma.$connect();
    console.log("Prisma connected to PostgreSQL");
  } catch (err) {
    console.error("Prisma connection error:", err);
    process.exit(1);
  }

  // 2. Роуты
  app.get("/health", async () => {
    return { ok: true };
  });

  // 3. Запуск Fastify
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Backend running on port 3000");
  } catch (err) {
    console.error("Server error:", err);
    process.exit(1);
  }
}

start();
