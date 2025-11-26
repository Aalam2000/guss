import fastify from "fastify";
import {PrismaClient} from '@prisma/client';

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
    await app.register(require("@fastify/cors"), {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"]
    });
    // 2. Роуты

    // --- LOGIN ---
    app.post("/login", async (req, reply) => {
        const {username, password} = req.body as any;

        if (!username || !password) {
            return reply.code(400).send({error: "Missing credentials"});
        }

        let role: any = "user";
        if (username === "admin") role = "admin";
        if (username === "Никита" || username === "nikita") role = "nikita";

        let user = await prisma.user.findUnique({where: {username}});

        if (!user) {
            user = await prisma.user.create({
                data: {
                    username,
                    passwordHash: password,
                    role
                }
            });
        } else if (user.passwordHash !== password) {
            return reply.code(403).send({error: "Wrong password"});
        }

        return {userId: user.id, role: user.role};
    });


    // --- LIST ROUNDS ---
    app.get("/rounds", async () => {
        return prisma.round.findMany({
            orderBy: {startAt: "desc"}
        });
    });


    // --- CREATE ROUND (ADMIN) ---
    app.post("/rounds", async (req, reply) => {
        const {userId, durationSec, cooldownSec} = req.body as any;

        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user || user.role !== "admin") {
            return reply.code(403).send({error: "Not admin"});
        }

        const now = new Date();
        const startAt = new Date(now.getTime() + cooldownSec * 1000);
        const endAt = new Date(startAt.getTime() + durationSec * 1000);

        const round = await prisma.round.create({
            data: {startAt, endAt}
        });

        return round;
    });


    // --- GET ROUND INFO ---
    app.get("/rounds/:id", async (req) => {
        const {id} = req.params as any;

        const round = await prisma.round.findUnique({
            where: {id},
            include: {scores: {include: {user: true}}}
        });

        if (!round) return {error: "Not found"};

        // определение победителя
        let winner = null;
        if (new Date() > round.endAt) {
            const best = [...round.scores].sort((a, b) => b.points - a.points)[0];
            if (best) winner = {username: best.user.username, points: best.points};
        }

        return {...round, winner};
    });


    // --- TAP (АТОМАРНО) ---
    app.post("/rounds/:id/tap", async (req, reply) => {
        const {id} = req.params as any;
        const {userId} = req.body as any;

        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user) return reply.code(400).send({error: "Bad user"});

        const round = await prisma.round.findUnique({where: {id}});
        if (!round) return reply.code(404).send({error: "Round not found"});

        const now = new Date();
        if (!(now >= round.startAt && now <= round.endAt)) {
            return reply.code(400).send({error: "Round not active"});
        }

        // Никита — тапы работают, но в статистике нули
        const isNikita = user.role === "nikita";

        // атомарный инкремент
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.userRoundScore.findUnique({
                where: {userId_roundId: {userId, roundId: id}}
            });

            if (!existing) {
                await tx.userRoundScore.create({
                    data: {userId, roundId: id}
                });
            }

            const updated = await tx.userRoundScore.update({
                where: {userId_roundId: {userId, roundId: id}},
                data: {
                    taps: {increment: 1},
                    points: {
                        increment: isNikita ? 0 : 1 // потом пересчитаем 11-й
                    }
                }
            });

            // 11-й тап = +10 очков
            if (!isNikita && updated.taps % 11 === 0) {
                await tx.userRoundScore.update({
                    where: {userId_roundId: {userId, roundId: id}},
                    data: {points: {increment: 10}}
                });
            }

            return updated;
        });

        return {taps: result.taps, points: isNikita ? 0 : result.points};
    });


    // 3. Запуск Fastify
    try {
        await app.listen({port: 3000, host: "0.0.0.0"});
        console.log("Backend running on port 3000");
    } catch (err) {
        console.error("Server error:", err);
        process.exit(1);
    }
}

start();
