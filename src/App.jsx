import { useEffect, useMemo, useRef, useState } from "react";
import NewChallenge from "./components/NewChallenge";
import Dashboard from "./components/Dashboard";
import AmountsGrid from "./components/AmountsGrid";
import History from "./components/History";
import { drawNext, progressSeries, toISODate, toggleSlot } from "./lib/challenge";
import { exportFile, importFile, loadState, saveState } from "./lib/storage";

export default function App() {
    const [state, setState] = useState(loadState);
    const [theme, setTheme] = useState(
        // La primera vez se respeta el tema del sistema; después, lo que haya elegido la persona
        () => localStorage.getItem("theme") ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
    );
    const [creating, setCreating] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirm, setConfirm] = useState(null); // { title, text, action }
    const [toast, setToast] = useState(null);
    const [lastDraw, setLastDraw] = useState(null);
    const fileInput = useRef(null);

    const today = toISODate();
    const active = state.challenges.find((challenge) => challenge.id === state.activeId) ?? null;

    useEffect(() => saveState(state), [state]);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("theme", theme);
    }, [theme]);
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2600);
        return () => clearTimeout(timer);
    }, [toast]);

    const series = useMemo(() => (active ? progressSeries(active, today) : []), [active, today]);

    function updateActive(updater) {
        setState((current) => ({
            ...current,
            challenges: current.challenges.map((challenge) =>
                challenge.id === current.activeId ? updater(challenge) : challenge,
            ),
        }));
    }

    function handleDraw() {
        const { challenge, slot } = drawNext(active, { date: today });
        if (!slot) return;
        updateActive(() => challenge);
        setLastDraw(slot);
    }

    function handleToggle(index) {
        updateActive((challenge) => toggleSlot(challenge, index, today));
        setLastDraw(null);
    }

    function handleCreate(challenge) {
        setState((current) => ({ challenges: [...current.challenges, challenge], activeId: challenge.id }));
        setCreating(false);
        setLastDraw(null);
        setToast("Reto creado");
    }

    async function handleImport(event) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        try {
            setState(await importFile(file));
            setToast("Progreso importado");
        } catch (error) {
            setToast(error.message);
        }
    }

    if (!active || creating) {
        return (
            <main className="app">
                <Header
                    theme={theme}
                    onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
                    challenges={state.challenges}
                    activeId={state.activeId}
                    onSelect={(id) => setState((c) => ({ ...c, activeId: id }))}
                    onMenu={() => setMenuOpen(true)}
                    showMenu={state.challenges.length > 0}
                />
                <NewChallenge onCreate={handleCreate} onCancel={() => setCreating(false)} isFirst={!active} />
                <Footer />
            </main>
        );
    }

    return (
        <main className="app">
            <Header
                theme={theme}
                onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
                challenges={state.challenges}
                activeId={state.activeId}
                onSelect={(id) => {
                    setState((c) => ({ ...c, activeId: id }));
                    setLastDraw(null);
                }}
                onMenu={() => setMenuOpen(true)}
                showMenu
            />

            <div className="grid grid-main">
                <div className="grid">
                    <Dashboard
                        challenge={active}
                        today={today}
                        series={series}
                        lastDraw={lastDraw}
                        onDraw={handleDraw}
                        onToggle={handleToggle}
                    />
                </div>
                <div className="grid">
                    <AmountsGrid challenge={active} onToggle={handleToggle} />
                    <History challenge={active} onToggle={handleToggle} />
                </div>
            </div>

            <Footer />

            {menuOpen && (
                <div className="overlay" onClick={() => setMenuOpen(false)}>
                    <div className="dialog" onClick={(event) => event.stopPropagation()}>
                        <h2>Opciones</h2>
                        <div className="menu-list">
                            <button type="button" onClick={() => { setMenuOpen(false); setCreating(true); }}>
                                ➕ Crear otro reto
                            </button>
                            <button type="button" onClick={() => { exportFile(state); setMenuOpen(false); setToast("Respaldo descargado"); }}>
                                ⬇️ Exportar mi progreso
                            </button>
                            <button type="button" onClick={() => fileInput.current?.click()}>
                                ⬆️ Importar un respaldo
                            </button>
                            <button
                                type="button"
                                className="is-danger"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setConfirm({
                                        title: "¿Borrar los depósitos?",
                                        text: "El reto se queda, pero vuelve a cero. Esto no se puede deshacer.",
                                        action: () => updateActive((c) => ({ ...c, slots: c.slots.map((s) => ({ ...s, doneAt: null })) })),
                                    });
                                }}
                            >
                                ♻️ Reiniciar este reto
                            </button>
                            <button
                                type="button"
                                className="is-danger"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setConfirm({
                                        title: "¿Eliminar el reto?",
                                        text: `Se borra “${active.name}” con todo su progreso. Esto no se puede deshacer.`,
                                        action: () =>
                                            setState((current) => {
                                                const challenges = current.challenges.filter((c) => c.id !== current.activeId);
                                                return { challenges, activeId: challenges[0]?.id ?? null };
                                            }),
                                    });
                                }}
                            >
                                🗑️ Eliminar este reto
                            </button>
                        </div>
                        <div className="dialog-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirm && (
                <div className="overlay" onClick={() => setConfirm(null)}>
                    <div className="dialog" onClick={(event) => event.stopPropagation()}>
                        <h2>{confirm.title}</h2>
                        <p>{confirm.text}</p>
                        <div className="dialog-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => {
                                    confirm.action();
                                    setConfirm(null);
                                    setLastDraw(null);
                                    setToast("Listo");
                                }}
                            >
                                Sí, continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input ref={fileInput} type="file" accept="application/json" hidden onChange={handleImport} />
            {toast && <p className="toast">{toast}</p>}
        </main>
    );
}

function Header({ theme, onTheme, challenges, activeId, onSelect, onMenu, showMenu }) {
    return (
        <header className="header">
            <p className="brand">
                <span className="brand-mark" aria-hidden="true">🏦</span>
                Reto de Ahorro
            </p>
            <div className="header-actions">
                {challenges.length > 1 && (
                    <select
                        className="select-challenge"
                        value={activeId ?? ""}
                        onChange={(event) => onSelect(event.target.value)}
                        aria-label="Cambiar de reto"
                    >
                        {challenges.map((challenge) => (
                            <option key={challenge.id} value={challenge.id}>
                                {challenge.name}
                            </option>
                        ))}
                    </select>
                )}
                <button type="button" className="icon-btn" onClick={onTheme} aria-label="Cambiar tema">
                    {theme === "dark" ? "☀" : "☾"}
                </button>
                {showMenu && (
                    <button type="button" className="icon-btn" onClick={onMenu} aria-label="Opciones">
                        ⋯
                    </button>
                )}
            </div>
        </header>
    );
}

function Footer() {
    return (
        <p className="footer">
            Tus datos se guardan solo en este navegador. Exporta un respaldo desde el menú para pasarlos a otro
            dispositivo.
        </p>
    );
}
