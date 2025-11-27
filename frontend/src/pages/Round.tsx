// frontend/src/pages/Round.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Round() {
    const { id } = useParams();
    const userId = localStorage.getItem("userId");
    // const username = localStorage.getItem("username");

    const [info, setInfo] = useState<any>(null);
    const [status, setStatus] = useState<"cooldown" | "active" | "finished">("cooldown");
    const [timeLeft, setTimeLeft] = useState(0);

    //
    // --- ВЫХОД ---
    //
    const logout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        window.location.href = "/login";
    };

    //
    // --- НАЗАД ---
    //
    const goBack = () => {
        window.location.href = "/rounds";
    };

    //
    // --- ОПРЕДЕЛЕНИЕ СТАТУСА ---
    //
    const calcStatus = (data: any) => {
        const now = Date.now();
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();

        if (now < start) return "cooldown";
        if (now >= start && now <= end) return "active";
        return "finished";
    };

    const calcTimeLeft = (data: any) => {
        const now = Date.now();
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();

        if (now < start) return Math.floor((start - now) / 1000);
        if (now <= end) return Math.floor((end - now) / 1000);
        return 0;
    };

    //
    // --- ТАП ---
    //
    const tap = async () => {
        if (status !== "active") return;

        await fetch(`http://localhost:3010/rounds/${id}/tap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });

        load();
    };

    //
    // --- ЗАГРУЗКА РАУНДА ---
    //
    const load = async () => {
        const data = await fetch(`http://localhost:3010/rounds/${id}`).then((r) => r.json());
        setInfo(data);

        const st = calcStatus(data);
        setStatus(st);
        setTimeLeft(calcTimeLeft(data));
    };

    //
    // --- ПОЛЛИНГ ---
    //
    useEffect(() => {
        let interval: any = null;

        const adjustPolling = (st: string) => {
            if (interval) clearInterval(interval);

            if (st === "cooldown") interval = setInterval(load, 2000);
            else if (st === "active") interval = setInterval(load, 1000);
            else interval = null;
        };

        const firstLoad = async () => {
            await load();
            adjustPolling(calcStatus(info || {}));
        };

        firstLoad();

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    //
    // --- ЛОКАЛЬНЫЙ ТАЙМЕР ---
    //
    useEffect(() => {
        if (!info) return;

        const timer = setInterval(() => {
            setTimeLeft(calcTimeLeft(info));
        }, 500);

        return () => clearInterval(timer);
    }, [info]);

    //
    // --- UI ---
    //
    if (!info) return <p>Loading...</p>;

    const myScore = info.scores?.find((s: any) => s.userId === userId)?.points ?? 0;

    const winner = info.winner ? info.winner.username : null;
    const winnerPoints = info.winner ? info.winner.points : 0;

    return (
        <div style={{ padding: 40, textAlign: "center" }}>
            {/* ВЫХОД */}
            <button
                onClick={logout}
                style={{
                    position: "fixed",
                    top: 20,
                    right: 20,
                    padding: "8px 14px",
                    background: "#e74c3c",
                    color: "white",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
            >
                Выйти
            </button>

            {/* НАЗАД */}
            <button
                onClick={goBack}
                style={{
                    position: "fixed",
                    top: 20,
                    left: 20,
                    padding: "8px 14px",
                    background: "#4a90e2",
                    color: "white",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
            >
                ← Назад
            </button>

            <h2>Раунд</h2>

            {status === "cooldown" && <h3>До начала: {timeLeft}s</h3>}
            {status === "active" && <h3>До конца: {timeLeft}s</h3>}
            {status === "finished" && <h3>Раунд завершён</h3>}

            {/* ИТОГИ */}
            {status === "finished" && (
                <>
                    <h3>Итоги</h3>
                    <p>
                        <b>Победитель:</b> {winner}
                    </p>
                    <p>
                        <b>Очки победителя:</b> {winnerPoints}
                    </p>
                    <p>
                        <b>Мои очки:</b> {myScore}
                    </p>
                </>
            )}

            {/* СПИСОК ИГРОКОВ */}
            <h3>Все игроки:</h3>
            <div style={{ maxWidth: 350, margin: "0 auto" }}>
                {info.scores.map((s: any) => {
                    const isMe = s.userId === userId;
                    const isNikita = s.user.role === "nikita";

                    return (
                        <div
                            key={s.userId}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "6px 0",
                                borderBottom: "1px solid #ddd",
                                fontWeight: isMe ? 700 : 400,
                                color: isNikita ? "#777" : "black",
                            }}
                        >
                            <span>
                                {s.user.username}{" "}
                                {isNikita && <span style={{ fontSize: 12 }}>(Гость)</span>}
                            </span>
                            <span>{s.points}</span>
                        </div>
                    );
                })}
            </div>

            {/* ГУСЬ */}
            <div
                onClick={tap}
                style={{
                    margin: "40px auto",
                    width: 220,
                    height: 220,
                    borderRadius: "50%",
                    background: status === "active" ? "#ffd700" : "#999",
                    cursor: status === "active" ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 60,
                    userSelect: "none",
                }}
            >
                🦆
            </div>

            <h3>Мои очки: {myScore}</h3>
        </div>
    );
}
