import { useMemo, useState } from "react";
import { MODES, createChallenge, formatMoney, targetOf, toISODate } from "../lib/challenge";

const ORDER = ["classic", "goal", "weekly", "fixed", "reverse"];

/** Alta de un reto: eliges modo, ajustas los números y ves el total antes de crearlo. */
export default function NewChallenge({ onCreate, onCancel, isFirst }) {
    const [mode, setMode] = useState("classic");
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState(toISODate());
    const [days, setDays] = useState(365);
    const [target, setTarget] = useState(30000);
    const [multiplier, setMultiplier] = useState(10);
    const [dailyAmount, setDailyAmount] = useState(50);

    const draft = useMemo(() => {
        try {
            return createChallenge({ name, mode, startDate, days, target, multiplier, dailyAmount });
        } catch {
            return null;
        }
    }, [name, mode, startDate, days, target, multiplier, dailyAmount]);

    const amounts = draft?.slots.map((slot) => slot.amount) ?? [];
    const total = draft ? targetOf(draft) : 0;
    const cadence = MODES[mode].cadence === "weekly" ? "semanas" : "días";

    return (
        <section className="onboarding">
            <div>
                <h1>{isFirst ? "Arma tu reto de ahorro" : "Nuevo reto"}</h1>
                <p className="lead">
                    Elige cómo quieres ahorrar. Puedes seguir el reto clásico de 365 días o poner tu propia meta: la app
                    reparte los montos y lleva la cuenta por ti.
                </p>
            </div>

            <div className="modes">
                {ORDER.map((id) => (
                    <button
                        key={id}
                        type="button"
                        className={`mode ${mode === id ? "is-active" : ""}`}
                        onClick={() => {
                            setMode(id);
                            setDays(id === "weekly" ? 52 : id === "goal" ? 180 : 365);
                        }}
                    >
                        <b>{MODES[id].name}</b>
                        <span>{MODES[id].description}</span>
                    </button>
                ))}
            </div>

            <div className="fields">
                <label className="field">
                    Nombre del reto
                    <input
                        type="text"
                        value={name}
                        placeholder={MODES[mode].name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </label>

                <label className="field">
                    Empieza el
                    <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </label>

                {mode === "goal" && (
                    <>
                        <label className="field">
                            Quiero juntar
                            <input
                                type="number"
                                min="100"
                                step="100"
                                value={target}
                                onChange={(event) => setTarget(Math.max(100, Number(event.target.value)))}
                            />
                        </label>
                        <label className="field">
                            En cuántos días
                            <input
                                type="number"
                                min="7"
                                max="730"
                                value={days}
                                onChange={(event) => setDays(Math.min(730, Math.max(7, Number(event.target.value))))}
                            />
                        </label>
                    </>
                )}

                {mode === "weekly" && (
                    <label className="field">
                        Multiplicador por semana
                        <select value={multiplier} onChange={(event) => setMultiplier(Number(event.target.value))}>
                            {[1, 5, 10, 20, 50, 100].map((value) => (
                                <option key={value} value={value}>
                                    ×{value} · hasta {formatMoney(52 * value)} la última semana
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {mode === "fixed" && (
                    <>
                        <label className="field">
                            Monto diario
                            <input
                                type="number"
                                min="1"
                                value={dailyAmount}
                                onChange={(event) => setDailyAmount(Math.max(1, Number(event.target.value)))}
                            />
                        </label>
                        <label className="field">
                            Durante cuántos días
                            <input
                                type="number"
                                min="7"
                                max="730"
                                value={days}
                                onChange={(event) => setDays(Math.min(730, Math.max(7, Number(event.target.value))))}
                            />
                        </label>
                    </>
                )}

                {(mode === "classic" || mode === "reverse") && (
                    <label className="field">
                        Cuántos días
                        <input
                            type="number"
                            min="7"
                            max="730"
                            value={days}
                            onChange={(event) => setDays(Math.min(730, Math.max(7, Number(event.target.value))))}
                        />
                    </label>
                )}
            </div>

            <div className="preview">
                <p>
                    Vas a juntar <b>{formatMoney(total)}</b> en <b>{amounts.length} {cadence}</b>.
                </p>
                <p>
                    Montos de <b>{formatMoney(Math.min(...amounts))}</b> a <b>{formatMoney(Math.max(...amounts))}</b> ·
                    promedio <b>{formatMoney(Math.round(total / Math.max(1, amounts.length)))}</b> por depósito.
                </p>
            </div>

            <div className="today-actions">
                <button type="button" className="btn btn-primary" onClick={() => onCreate(draft)} disabled={!draft}>
                    Crear reto
                </button>
                {!isFirst && (
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        Cancelar
                    </button>
                )}
            </div>
        </section>
    );
}
