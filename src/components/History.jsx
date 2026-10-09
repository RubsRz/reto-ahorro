import { formatDate, formatMoney } from "../lib/challenge";

/** Últimos depósitos, del más reciente al más viejo. */
export default function History({ challenge, onToggle }) {
    const deposits = challenge.slots
        .filter((slot) => slot.doneAt)
        .sort((a, b) => b.doneAt.localeCompare(a.doneAt) || b.i - a.i)
        .slice(0, 40);

    return (
        <section className="card">
            <div className="section-head">
                <h2>Historial</h2>
                <span className="today-hint">{deposits.length ? `${deposits.length} más recientes` : ""}</span>
            </div>

            {deposits.length === 0 ? (
                <p className="empty">
                    Aquí van a aparecer tus depósitos.
                    <span>Registra el primero y empieza la racha.</span>
                </p>
            ) : (
                <ul className="history">
                    {deposits.map((slot) => (
                        <li key={slot.i}>
                            <time dateTime={slot.doneAt}>{formatDate(slot.doneAt)}</time>
                            <b>{formatMoney(slot.amount, challenge.currency)}</b>
                            <button type="button" className="icon-btn" title="Deshacer" onClick={() => onToggle(slot.i)}>
                                ↺
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
