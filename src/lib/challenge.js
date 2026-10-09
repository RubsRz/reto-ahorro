/**
 * Motor del reto de ahorro: arma los montos de cada modo, registra depósitos
 * y calcula las estadísticas. No sabe nada de React ni del navegador, por eso
 * se puede probar solo (ver challenge.test.js).
 */

export const MODES = {
    classic: {
        id: "classic",
        name: "Reto de 365 días",
        short: "Clásico",
        description: "Un monto distinto cada día, del 1 al 365, en orden aleatorio.",
        cadence: "daily",
        order: "random",
    },
    reverse: {
        id: "reverse",
        name: "Reto inverso",
        short: "Inverso",
        description: "Empiezas por los montos más altos y vas bajando: lo difícil, al principio.",
        cadence: "daily",
        order: "fixed",
    },
    weekly: {
        id: "weekly",
        name: "52 semanas",
        short: "Semanal",
        description: "Un depósito por semana, de la semana 1 a la 52, con el multiplicador que elijas.",
        cadence: "weekly",
        order: "fixed",
    },
    fixed: {
        id: "fixed",
        name: "Monto fijo",
        short: "Fijo",
        description: "La misma cantidad todos los días. Predecible y fácil de sostener.",
        cadence: "daily",
        order: "fixed",
    },
    goal: {
        id: "goal",
        name: "Meta personalizada",
        short: "Meta",
        description: "Tú pones cuánto quieres juntar y en cuántos días; los montos se reparten para llegar exacto.",
        cadence: "daily",
        order: "random",
    },
};

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha en formato YYYY-MM-DD, en hora local (no UTC, para que no se recorra un día). */
export function toISODate(date = new Date()) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISODate(iso) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function daysBetween(fromISO, toISO) {
    return Math.round((parseISODate(toISO) - parseISODate(fromISO)) / DAY_MS);
}

export function addDays(iso, days) {
    const date = parseISODate(iso);
    date.setDate(date.getDate() + days);
    return toISODate(date);
}

/**
 * Reparte `target` en `count` montos que suben poco a poco y suman exactamente la meta.
 * Los montos se redondean al múltiplo de `step` y la diferencia que deja el redondeo
 * se ajusta en los últimos, para que la suma cuadre al peso.
 */
export function rampAmounts(target, count, step = 5) {
    if (count <= 0) return [];
    const weights = Array.from({ length: count }, (_, i) => 1 + (i / Math.max(1, count - 1)) * 1.6);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    const amounts = weights.map((weight) => Math.max(step, Math.round((target * weight) / totalWeight / step) * step));
    let difference = target - amounts.reduce((sum, amount) => sum + amount, 0);

    // El sobrante (o faltante) se reparte de atrás hacia adelante, de `step` en `step`
    let index = count - 1;
    let guard = 0;
    while (difference !== 0 && guard < count * 200) {
        const delta = difference > 0 ? step : -step;
        const next = amounts[index] + delta;
        if (next >= step && Math.abs(difference) >= step) {
            amounts[index] = next;
            difference -= delta;
        } else if (Math.abs(difference) < step) {
            amounts[index] += difference; // el resto exacto va al último ajustado
            difference = 0;
        }
        index = index === 0 ? count - 1 : index - 1;
        guard++;
    }
    return amounts;
}

function baseAmounts({ mode, days, target, multiplier, dailyAmount, step }) {
    switch (mode) {
        case "classic":
            return Array.from({ length: days }, (_, i) => i + 1);
        case "reverse":
            return Array.from({ length: days }, (_, i) => days - i);
        case "weekly":
            return Array.from({ length: days }, (_, i) => (i + 1) * multiplier);
        case "fixed":
            return Array.from({ length: days }, () => dailyAmount);
        case "goal":
            return rampAmounts(target, days, step);
        default:
            throw new Error(`Modo desconocido: ${mode}`);
    }
}

let idCounter = 0;
const newId = () => `${Date.now().toString(36)}${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Crea un reto nuevo. Cada "slot" es un monto por depositar; se marcan en el orden
 * que quieras (sorteado o en orden), y cada uno guarda el día en que lo depositaste.
 */
export function createChallenge({
    name,
    mode = "classic",
    days,
    target,
    multiplier = 1,
    dailyAmount = 50,
    step = 5,
    startDate = toISODate(),
    currency = "MXN",
}) {
    const config = MODES[mode];
    if (!config) throw new Error(`Modo desconocido: ${mode}`);

    const slots = mode === "weekly" ? (days ?? 52) : (days ?? 365);
    const amounts = baseAmounts({ mode, days: slots, target, multiplier, dailyAmount, step });

    return {
        id: newId(),
        name: name?.trim() || config.name,
        mode,
        cadence: config.cadence,
        order: config.order,
        currency,
        startDate,
        createdAt: new Date().toISOString(),
        archivedAt: null,
        slots: amounts.map((amount, index) => ({ i: index, amount, doneAt: null })),
    };
}

export const targetOf = (challenge) => challenge.slots.reduce((sum, slot) => sum + slot.amount, 0);
export const savedOf = (challenge) =>
    challenge.slots.reduce((sum, slot) => sum + (slot.doneAt ? slot.amount : 0), 0);
export const pendingSlots = (challenge) => challenge.slots.filter((slot) => !slot.doneAt);
export const doneSlots = (challenge) => challenge.slots.filter((slot) => slot.doneAt);

/** Marca un monto como depositado (o lo desmarca si ya lo estaba). */
export function toggleSlot(challenge, index, date = toISODate()) {
    const slots = challenge.slots.map((slot) =>
        slot.i === index ? { ...slot, doneAt: slot.doneAt ? null : date } : slot,
    );
    return { ...challenge, slots };
}

/**
 * Sortea un monto pendiente (modo clásico y meta) o toma el siguiente en orden.
 * `random` se recibe como parámetro para poder probarlo con un valor fijo.
 */
export function drawNext(challenge, { date = toISODate(), random = Math.random } = {}) {
    const pending = pendingSlots(challenge);
    if (!pending.length) return { challenge, slot: null };

    const slot = challenge.order === "random" ? pending[Math.floor(random() * pending.length)] : pending[0];
    return { challenge: toggleSlot(challenge, slot.i, date), slot };
}

/** Cuántos depósitos deberías llevar hoy si fueras al día. */
export function expectedSlots(challenge, today = toISODate()) {
    const elapsed = daysBetween(challenge.startDate, today);
    if (elapsed < 0) return 0;
    const periods = challenge.cadence === "weekly" ? Math.floor(elapsed / 7) + 1 : elapsed + 1;
    return Math.min(periods, challenge.slots.length);
}

/** Días seguidos (o semanas, en el modo semanal) con depósito, contando hacia atrás desde hoy. */
export function currentStreak(challenge, today = toISODate()) {
    const dates = new Set(doneSlots(challenge).map((slot) => slot.doneAt));
    if (!dates.size) return 0;

    const stepDays = challenge.cadence === "weekly" ? 7 : 1;
    let streak = 0;
    let cursor = today;
    // Si hoy todavía no registras, la racha se cuenta desde el período anterior
    if (!dates.has(cursor)) cursor = addDays(cursor, -stepDays);
    while (dates.has(cursor)) {
        streak++;
        cursor = addDays(cursor, -stepDays);
    }
    return streak;
}

export function stats(challenge, today = toISODate()) {
    const target = targetOf(challenge);
    const saved = savedOf(challenge);
    const done = doneSlots(challenge);
    const total = challenge.slots.length;
    const expected = expectedSlots(challenge, today);

    // Lo que "deberías" llevar: los montos más pequeños pendientes no importan,
    // se compara contra el promedio por depósito para que sea justo en todos los modos
    const expectedAmount = Math.round((target / total) * expected);
    const elapsedDays = Math.max(0, daysBetween(challenge.startDate, today) + 1);
    const perDay = done.length ? saved / Math.max(1, elapsedDays) : 0;
    const remaining = target - saved;

    return {
        target,
        saved,
        remaining,
        percent: target ? (saved / target) * 100 : 0,
        done: done.length,
        total,
        expected,
        expectedAmount,
        ahead: saved - expectedAmount,
        streak: currentStreak(challenge, today),
        bestStreak: bestStreak(challenge),
        perDay,
        // Al ritmo actual, ¿cuándo terminarías?
        projectedEnd: perDay > 0 ? addDays(today, Math.ceil(remaining / perDay)) : null,
        plannedEnd: addDays(challenge.startDate, (challenge.cadence === "weekly" ? 7 : 1) * (total - 1)),
        complete: done.length === total,
    };
}

export function bestStreak(challenge) {
    const stepDays = challenge.cadence === "weekly" ? 7 : 1;
    const dates = [...new Set(doneSlots(challenge).map((slot) => slot.doneAt))].sort();
    let best = 0;
    let run = 0;
    let previous = null;

    for (const date of dates) {
        run = previous && daysBetween(previous, date) === stepDays ? run + 1 : 1;
        best = Math.max(best, run);
        previous = date;
    }
    return best;
}

/** Serie acumulada por día, para la gráfica: lo real contra el plan ideal. */
export function progressSeries(challenge, today = toISODate()) {
    const done = doneSlots(challenge).sort((a, b) => a.doneAt.localeCompare(b.doneAt));
    if (!done.length) return [];

    const stepDays = challenge.cadence === "weekly" ? 7 : 1;
    const target = targetOf(challenge);
    const total = challenge.slots.length;
    const lastDate = done.at(-1).doneAt > today ? done.at(-1).doneAt : today;
    const span = Math.max(1, daysBetween(challenge.startDate, lastDate));

    const points = [];
    let accumulated = 0;
    let index = 0;
    for (let day = 0; day <= span; day++) {
        const date = addDays(challenge.startDate, day);
        while (index < done.length && done[index].doneAt <= date) accumulated += done[index++].amount;
        const idealPeriods = Math.min(total, Math.floor(day / stepDays) + 1);
        points.push({ date, saved: accumulated, ideal: Math.round((target / total) * idealPeriods) });
    }
    return points;
}

export const formatMoney = (value, currency = "MXN") =>
    (value ?? 0).toLocaleString("es-MX", { style: "currency", currency, maximumFractionDigits: 0 });

export const formatDate = (iso) =>
    parseISODate(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
