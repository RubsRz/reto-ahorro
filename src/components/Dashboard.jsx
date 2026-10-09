import { useState } from "react";
import { MODES, formatDate, formatMoney, pendingSlots, stats } from "../lib/challenge";
import ProgressChart from "./ProgressChart";

const RING = 2 * Math.PI * 58;

/** Resumen de avance y el depósito del día. */
export default function Dashboard({ challenge, today, series, onDraw, onToggle, lastDraw }) {
    const [showPending, setShowPending] = useState(false);
    const s = stats(challenge, today);
    const pending = pendingSlots(challenge);
    const depositedToday = challenge.slots.filter((slot) => slot.doneAt === today);
    const isRandom = challenge.order === "random";
    const cadence = challenge.cadence === "weekly" ? "semana" : "día";

    return (
        <>
            <section className="hero">
                <div className="hero-top">
                    <div className="ring">
                        <svg viewBox="0 0 132 132">
                            <circle cx="66" cy="66" r="58" fill="none" stroke="var(--surface-2)" strokeWidth="11" />
                            <circle
                                cx="66"
                                cy="66"
                                r="58"
                                fill="none"
                                stroke="var(--success)"
                                strokeWidth="11"
                                strokeLinecap="round"
                                strokeDasharray={RING}
                                strokeDashoffset={RING * (1 - Math.min(1, s.percent / 100))}
                                style={{ transition: "stroke-dashoffset 0.6s ease" }}
                            />
                        </svg>
                        <div style={{ textAlign: "center" }}>
                            <p className="ring-value">{s.percent.toFixed(s.percent < 10 ? 1 : 0)}%</p>
                            <p className="ring-label">avance</p>
                        </div>
                    </div>

                    <div className="hero-amounts">
                        <p className="hero-saved">{formatMoney(s.saved, challenge.currency)}</p>
                        <p className="hero-target">
                            de {formatMoney(s.target, challenge.currency)} · {s.done} de {s.total} depósitos
                        </p>
                        {s.complete ? (
                            <span className="pill pill-ok">🎉 Reto completado</span>
                        ) : s.ahead >= 0 ? (
                            <span className="pill pill-ok">
                                Vas al corriente{s.ahead > 0 && `, ${formatMoney(s.ahead, challenge.currency)} adelante`}
                            </span>
                        ) : (
                            <span className="pill pill-late">
                                Te faltan {formatMoney(Math.abs(s.ahead), challenge.currency)} para ir al día
                            </span>
                        )}
                    </div>
                </div>

                <dl className="stats">
                    <div>
                        <dt>Te falta</dt>
                        <dd>{formatMoney(s.remaining, challenge.currency)}</dd>
                    </div>
                    <div>
                        <dt>Racha</dt>
                        <dd>{s.streak} {s.streak === 1 ? cadence : `${cadence}s`}</dd>
                    </div>
                    <div>
                        <dt>Mejor racha</dt>
                        <dd>{s.bestStreak}</dd>
                    </div>
                    <div>
                        <dt>Termina</dt>
                        <dd style={{ fontSize: "0.95rem" }}>
                            {s.complete ? "¡Listo!" : formatDate(s.projectedEnd ?? s.plannedEnd)}
                        </dd>
                    </div>
                </dl>
            </section>

            <section className="card today">
                <div className="today-head">
                    <h2>{challenge.cadence === "weekly" ? "Depósito de la semana" : "Depósito de hoy"}</h2>
                    <span className="today-date">{formatDate(today)}</span>
                </div>

                {lastDraw && (
                    <div className="draw-result">
                        <strong>{formatMoney(lastDraw.amount, challenge.currency)}</strong>
                        <span>{isRandom ? "¡Te tocó este monto!" : "Siguiente monto del plan"}</span>
                    </div>
                )}

                {depositedToday.length > 0 && !lastDraw && (
                    <p className="today-hint">
                        Ya registraste {depositedToday.length === 1 ? "un depósito" : `${depositedToday.length} depósitos`} hoy:{" "}
                        {depositedToday.map((slot) => formatMoney(slot.amount, challenge.currency)).join(" + ")}.
                    </p>
                )}

                {s.complete ? (
                    <p className="today-hint">Terminaste el reto. Ahorraste {formatMoney(s.target, challenge.currency)}. 👏</p>
                ) : (
                    <>
                        <div className="today-actions">
                            <button type="button" className="btn btn-primary" onClick={onDraw}>
                                {isRandom ? "🎲 Sortear monto" : "Registrar siguiente"}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowPending((v) => !v)}>
                                Elegir monto
                            </button>
                        </div>

                        {showPending && (
                            <div className="pending-list">
                                {pending.slice(0, 12).map((slot) => (
                                    <button key={slot.i} type="button" onClick={() => { onToggle(slot.i); setShowPending(false); }}>
                                        <span>{formatMoney(slot.amount, challenge.currency)}</span>
                                        <span className="today-hint">marcar como depositado</span>
                                    </button>
                                ))}
                                <p className="today-hint">
                                    Se muestran {Math.min(12, pending.length)} de {pending.length} pendientes; el resto está en “Montos”.
                                </p>
                            </div>
                        )}

                        <p className="today-hint">
                            {MODES[challenge.mode].name} · {isRandom
                                ? "cada día se sortea un monto que no hayas depositado."
                                : "los montos van en orden, uno por " + cadence + "."}
                        </p>
                    </>
                )}
            </section>

            <section className="card">
                <div className="section-head">
                    <h2>Avance</h2>
                    <span className="today-hint">
                        {formatMoney(Math.round(s.perDay), challenge.currency)} al día en promedio
                    </span>
                </div>
                <ProgressChart series={series} currency={challenge.currency} />
            </section>
        </>
    );
}
