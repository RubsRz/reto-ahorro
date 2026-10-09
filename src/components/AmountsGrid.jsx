import { useState } from "react";
import { formatDate, formatMoney } from "../lib/challenge";

const FILTERS = [
    { id: "all", label: "Todos" },
    { id: "pending", label: "Pendientes" },
    { id: "done", label: "Depositados" },
];

/** Todos los montos del reto. Tocar uno lo marca o lo desmarca. */
export default function AmountsGrid({ challenge, onToggle }) {
    const [filter, setFilter] = useState("all");

    const slots = challenge.slots.filter((slot) =>
        filter === "pending" ? !slot.doneAt : filter === "done" ? slot.doneAt : true,
    );

    return (
        <section className="card">
            <div className="section-head">
                <h2>Montos</h2>
                <div className="filters">
                    {FILTERS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={filter === item.id ? "is-active" : ""}
                            onClick={() => setFilter(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {slots.length === 0 ? (
                <p className="empty">No hay montos en este filtro.</p>
            ) : (
                <div className="amounts">
                    {slots.map((slot) => (
                        <button
                            key={slot.i}
                            type="button"
                            className={`amount ${slot.doneAt ? "is-done" : ""}`}
                            onClick={() => onToggle(slot.i)}
                            title={slot.doneAt ? `Depositado el ${formatDate(slot.doneAt)}` : "Marcar como depositado"}
                        >
                            {formatMoney(slot.amount, challenge.currency)}
                            {slot.doneAt && <small>✓</small>}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
