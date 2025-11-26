import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";

export default function Round() {
    const {id} = useParams();
    const userId = localStorage.getItem("userId");

    const [info, setInfo] = useState<any>(null);
    const [status, setStatus] = useState<"cooldown" | "active" | "finished">("cooldown");
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const load = () => {
        fetch(`http://localhost:3010/rounds/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setInfo(data);
                updateStatus(data);
            });
    };

    const updateStatus = (data: any) => {
        const now = Date.now();
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();

        if (now < start) {
            setStatus("cooldown");
            setTimeLeft(Math.floor((start - now) / 1000));
        } else if (now >= start && now <= end) {
            setStatus("active");
            setTimeLeft(Math.floor((end - now) / 1000));
        } else {
            setStatus("finished");
            setTimeLeft(0);
        }
    };

    const tap = async () => {
        if (status !== "active") return;

        await fetch(`http://localhost:3010/rounds/${id}/tap`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({userId}),
        });

        load();
    };

    useEffect(() => {
        let interval: any = null;

        const startPolling = (status: string) => {
            if (interval) clearInterval(interval);

            if (status === "cooldown") {
                interval = setInterval(load, 2000); // каждые 2 секунды
            } else if (status === "active") {
                interval = setInterval(load, 1000); // каждые 1 секунду
            } else if (status === "finished") {
                // остановить полностью
                clearInterval(interval);
                interval = null;
            }
        };

        const fetchAndSet = async () => {
            const data = await fetch(`http://localhost:3010/rounds/${id}`).then(r => r.json());
            setInfo(data);

            // определяем правильный статус
            const now = Date.now();
            const start = new Date(data.startAt).getTime();
            const end = new Date(data.endAt).getTime();

            let status = "finished";
            if (now < start) status = "cooldown";
            else if (now >= start && now <= end) status = "active";

            startPolling(status);
        };

        fetchAndSet(); // первый вызов

        return () => clearInterval(interval);
    }, [id]);


    if (!info) return <p>Loading...</p>;

    const myScore = info.scores?.find((s: any) => s.userId === userId)?.points ?? 0;

    return (
        <div style={{padding: 40, textAlign: "center"}}>
            <h2>Раунд</h2>

            {/* ТАБЛИЧКА С СОСТОЯНИЕМ */}
            {status === "cooldown" && <h3>До начала: {timeLeft}s</h3>}
            {status === "active" && <h3>До конца: {timeLeft}s</h3>}
            {status === "finished" && (
                <div>
                    <h3>Раунд завершён</h3>

                    {/* СТАТИСТИКА */}
                    <div style={{marginTop: 20}}>
                        <h4>Итоги</h4>

                        <p><b>Победитель:</b> {info.winner?.username ?? "—"}</p>
                        <p><b>Очки победителя:</b> {info.winner?.points ?? 0}</p>

                        <p><b>Мои очки:</b> {myScore}</p>

                        <h4 style={{marginTop: 30}}>Все игроки:</h4>
                        <div style={{textAlign: "left", maxWidth: 300, margin: "0 auto"}}>
                            {info.scores
                                ?.sort((a: any, b: any) => b.points - a.points)
                                .map((s: any) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            padding: "6px 0",
                                            borderBottom: "1px solid #ccc",
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span>{s.user.username}</span>
                                        <span>{s.points}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}


            {/* ГУСЬ */}
            <div
                onClick={tap}
                style={{
                    margin: "40px auto",
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: status === "active" ? "#ffd700" : "#999",
                    cursor: status === "active" ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    userSelect: "none",
                }}
            >
                🦆
            </div>

            {/* МОИ ОЧКИ */}
            <h3>Мои очки: {myScore}</h3>
        </div>
    );
}
