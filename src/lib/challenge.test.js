import { describe, expect, it } from "vitest";
import {
    addDays,
    createChallenge,
    currentStreak,
    drawNext,
    expectedSlots,
    progressSeries,
    rampAmounts,
    stats,
    targetOf,
    toggleSlot,
} from "./challenge";

const START = "2026-01-01";

describe("montos de cada modo", () => {
    it("el clásico de 365 días suma 66,795", () => {
        const challenge = createChallenge({ mode: "classic", days: 365, startDate: START });
        expect(challenge.slots).toHaveLength(365);
        expect(targetOf(challenge)).toBe(66795);
    });

    it("el inverso tiene los mismos montos pero al revés", () => {
        const challenge = createChallenge({ mode: "reverse", days: 365, startDate: START });
        expect(challenge.slots[0].amount).toBe(365);
        expect(challenge.slots.at(-1).amount).toBe(1);
        expect(targetOf(challenge)).toBe(66795);
    });

    it("las 52 semanas usan el multiplicador", () => {
        const challenge = createChallenge({ mode: "weekly", days: 52, multiplier: 10, startDate: START });
        expect(challenge.cadence).toBe("weekly");
        expect(targetOf(challenge)).toBe(13780); // (1+…+52) × 10
    });

    it("el monto fijo multiplica por los días", () => {
        const challenge = createChallenge({ mode: "fixed", days: 100, dailyAmount: 50, startDate: START });
        expect(targetOf(challenge)).toBe(5000);
    });
});

describe("meta personalizada", () => {
    it.each([
        [30000, 180],
        [15000, 90],
        [66795, 365],
        [1000, 7],
    ])("reparte %i pesos en %i días sumando exacto", (target, days) => {
        const amounts = rampAmounts(target, days);
        expect(amounts).toHaveLength(days);
        expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(target);
        expect(Math.min(...amounts)).toBeGreaterThan(0);
    });

    it("los montos van subiendo poco a poco", () => {
        const amounts = rampAmounts(30000, 180);
        expect(amounts.at(-1)).toBeGreaterThan(amounts[0]);
    });

    it("el reto creado con meta llega justo al objetivo", () => {
        const challenge = createChallenge({ mode: "goal", target: 25000, days: 120, startDate: START });
        expect(targetOf(challenge)).toBe(25000);
    });
});

describe("depósitos", () => {
    it("marcar y desmarcar un monto cambia lo ahorrado", () => {
        let challenge = createChallenge({ mode: "classic", days: 365, startDate: START });
        challenge = toggleSlot(challenge, 9, START); // el monto de $10
        expect(stats(challenge, START).saved).toBe(10);
        challenge = toggleSlot(challenge, 9, START);
        expect(stats(challenge, START).saved).toBe(0);
    });

    it("el sorteo nunca repite un monto ya depositado", () => {
        let challenge = createChallenge({ mode: "classic", days: 10, startDate: START });
        const sorteados = [];
        for (let day = 0; day < 10; day++) {
            const result = drawNext(challenge, { date: addDays(START, day), random: () => 0.5 });
            challenge = result.challenge;
            sorteados.push(result.slot.amount);
        }
        expect(new Set(sorteados).size).toBe(10);
        expect(drawNext(challenge).slot).toBeNull(); // ya no queda nada pendiente
    });

    it("en los modos en orden toma el siguiente pendiente", () => {
        const challenge = createChallenge({ mode: "reverse", days: 365, startDate: START });
        expect(drawNext(challenge).slot.amount).toBe(365);
    });
});

describe("avance", () => {
    it("sabe cuántos depósitos deberías llevar", () => {
        const diario = createChallenge({ mode: "classic", days: 365, startDate: START });
        expect(expectedSlots(diario, START)).toBe(1);
        expect(expectedSlots(diario, "2026-01-10")).toBe(10);

        const semanal = createChallenge({ mode: "weekly", days: 52, startDate: START });
        expect(expectedSlots(semanal, "2026-01-15")).toBe(3);
    });

    it("no cuenta de más si ya terminaste el reto", () => {
        const challenge = createChallenge({ mode: "fixed", days: 10, dailyAmount: 50, startDate: START });
        expect(expectedSlots(challenge, "2027-01-01")).toBe(10);
    });

    it("la racha cuenta días seguidos y se corta con un hueco", () => {
        let challenge = createChallenge({ mode: "classic", days: 365, startDate: START });
        challenge = toggleSlot(challenge, 0, "2026-01-01");
        challenge = toggleSlot(challenge, 1, "2026-01-02");
        challenge = toggleSlot(challenge, 2, "2026-01-03");
        expect(currentStreak(challenge, "2026-01-03")).toBe(3);
        expect(currentStreak(challenge, "2026-01-04")).toBe(3); // aún no registras hoy
        expect(currentStreak(challenge, "2026-01-05")).toBe(0); // se cortó
    });

    it("dice si vas adelantado o atrasado", () => {
        let challenge = createChallenge({ mode: "fixed", days: 100, dailyAmount: 100, startDate: START });
        for (let i = 0; i < 5; i++) challenge = toggleSlot(challenge, i, addDays(START, i));
        const alDia = stats(challenge, addDays(START, 4));
        expect(alDia.ahead).toBe(0);
        expect(stats(challenge, addDays(START, 9)).ahead).toBeLessThan(0); // 5 días sin depositar
    });

    it("la serie de la gráfica acumula y termina en lo ahorrado", () => {
        let challenge = createChallenge({ mode: "fixed", days: 30, dailyAmount: 100, startDate: START });
        challenge = toggleSlot(challenge, 0, "2026-01-01");
        challenge = toggleSlot(challenge, 1, "2026-01-03");
        const series = progressSeries(challenge, "2026-01-03");
        expect(series).toHaveLength(3);
        expect(series.at(-1).saved).toBe(200);
        expect(series[1].saved).toBe(100); // el día 2 no hubo depósito
    });
});
