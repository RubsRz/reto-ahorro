import { formatMoney } from "../lib/challenge";

/**
 * Gráfica del avance: lo que llevas ahorrado contra el plan ideal.
 * Es SVG a mano, sin librerías, para no cargar 100 KB por dos líneas.
 */
export default function ProgressChart({ series, currency }) {
    if (series.length < 2) {
        return <p className="today-hint">La gráfica aparece cuando lleves al menos dos días con depósito.</p>;
    }

    const width = 640;
    const height = 180;
    const padding = { top: 12, right: 8, bottom: 18, left: 8 };
    // Se deja 25% de aire arriba para que la línea no quede pegada al borde
    const max = (Math.max(...series.map((point) => Math.max(point.saved, point.ideal))) || 1) * 1.25;

    const x = (index) => padding.left + (index / (series.length - 1)) * (width - padding.left - padding.right);
    const y = (value) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);

    const line = (key) => series.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point[key])}`).join(" ");
    const area = `${line("saved")} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    const last = series.at(-1);

    return (
        <div>
            <svg className="chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img"
                 aria-label={`Llevas ${formatMoney(last.saved, currency)} ahorrados; el plan marcaba ${formatMoney(last.ideal, currency)}`}>
                <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={area} fill="url(#fill)" />
                <path d={line("ideal")} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="6 6" />
                <path d={line("saved")} fill="none" stroke="var(--success)" strokeWidth="3" strokeLinejoin="round" />
                <circle cx={x(series.length - 1)} cy={y(last.saved)} r="4.5" fill="var(--success)" />
            </svg>
            <div className="chart-legend">
                <span><i style={{ background: "var(--success)" }} />Lo que llevas</span>
                <span><i style={{ background: "var(--muted)" }} />Plan ideal</span>
            </div>
        </div>
    );
}
