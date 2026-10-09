/**
 * Todo vive en el navegador: no hay cuentas ni servidor.
 * Para cambiar de dispositivo se exporta e importa un archivo .json.
 */
const KEY = "reto-ahorro:v1";

const empty = { challenges: [], activeId: null };

export function loadState() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return empty;
        const state = JSON.parse(raw);
        if (!Array.isArray(state.challenges)) return empty;
        return { challenges: state.challenges, activeId: state.activeId ?? state.challenges[0]?.id ?? null };
    } catch {
        return empty; // datos corruptos o localStorage bloqueado
    }
}

export function saveState(state) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
        // modo privado o sin espacio: la app sigue funcionando en memoria
    }
}

export function exportFile(state) {
    const payload = { app: "reto-ahorro", version: 1, exportedAt: new Date().toISOString(), ...state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reto-ahorro-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

export async function importFile(file) {
    const data = JSON.parse(await file.text());
    if (data.app !== "reto-ahorro" || !Array.isArray(data.challenges)) {
        throw new Error("Ese archivo no es un respaldo de Reto de Ahorro.");
    }
    return { challenges: data.challenges, activeId: data.activeId ?? data.challenges[0]?.id ?? null };
}
