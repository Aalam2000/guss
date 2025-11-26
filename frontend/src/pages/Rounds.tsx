// frontend/src/pages/Rounds.tsx
import {useEffect, useState} from "react";

export default function Rounds() {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    const [rounds, setRounds] = useState<any[]>([]);
    const [, forceUpdate] = useState(0); // обновление таймеров

    const loadRounds = () => {
        fetch("http://localhost:3010/rounds")
            .then((r) => r.json())
            .then((data) => setRounds(data));
    };

    useEffect(() => {
        loadRounds(); // ← загружаем ОДИН раз при входе на страницу

        const interval = setInterval(() => {
            forceUpdate((x) => x + 1);  // ← только обновляем таймеры
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const getStatus = (r: any) => {
        const now = Date.now();
        const start = new Date(r.startAt).getTime();
        const end = new Date(r.endAt).getTime();

        if (now < start) return "cooldown";
        if (now >= start && now <= end) return "active";
        return "finished";
    };

    const getTimeLeft = (r: any) => {
        const now = Date.now();
        const start = new Date(r.startAt).getTime();
        const end = new Date(r.endAt).getTime();

        if (now < start) return Math.floor((start - now) / 1000);
        if (now <= end) return Math.floor((end - now) / 1000);
        return 0;
    };

    const createRound = async () => {
        if (role !== "admin") return;

        await fetch("http://localhost:3010/rounds", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userId,
                durationSec: 60,
                cooldownSec: 10,
            }),
        });

        loadRounds();
    };

    return (
        <div style={{padding: 40}}>
            <button
              onClick={() => {
                localStorage.removeItem("userId");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
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

            <h2>Список раундов</h2>

            {role === "admin" && (
                <button
                    onClick={createRound}
                    style={{
                        padding: "10px 20px",
                        marginBottom: 20,
                        fontSize: 16,
                        cursor: "pointer",
                    }}
                >
                    Создать раунд
                </button>
            )}

            <div>
                {rounds.map((r) => {
                    const status = getStatus(r);
                    const timeLeft = getTimeLeft(r);

                    return (
                        <div
                            key={r.id}
                            style={{
                                border: "1px solid #ccc",
                                padding: 15,
                                marginBottom: 15,
                                borderRadius: 8,
                                background:
                                    status === "active"
                                        ? "#d4ffd4"
                                        : status === "cooldown"
                                            ? "#fff4c2"
                                            : "#eee",
                            }}
                        >
                            <b>Round ID:</b> {r.id} <br/>
                            Start: {r.startAt} <br/>
                            End: {r.endAt} <br/>
                            <b>Status:</b>{" "}
                            {status === "active" && (
                                <span style={{color: "green"}}>Активен ({timeLeft}s)</span>
                            )}
                            {status === "cooldown" && (
                                <span style={{color: "orange"}}>Ожидание ({timeLeft}s)</span>
                            )}
                            {status === "finished" && (
                                <span style={{color: "gray"}}>Завершён</span>
                            )}
                            <br/>
                            <br/>
                            <a
                                href={`/rounds/${r.id}`}
                                style={{
                                    display: "inline-block",
                                    padding: "8px 12px",
                                    background: "#4a90e2",
                                    color: "white",
                                    borderRadius: 6,
                                    textDecoration: "none",
                                    fontWeight: 600,
                                }}
                            >
                                Открыть
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
