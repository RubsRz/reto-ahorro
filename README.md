# 🏦 Reto de Ahorro

App para llevar un reto de ahorro: el clásico de **365 días**, 52 semanas, monto fijo,
reto inverso o **tu propia meta** ("quiero juntar $30,000 en 180 días").

Cada día sorteas un monto que no hayas depositado, lo marcas y la app lleva la cuenta:
cuánto llevas, cuánto falta, tu racha y si vas al corriente o atrasado.

## Qué hace

- **Cinco modos de reto**, incluida una meta personalizada en la que tú pones el monto
  y los días: los importes se reparten subiendo poco a poco y **suman exacto** la meta.
- **Sorteo del día** entre los montos que te faltan, o eliges uno a mano.
- **Avance real contra el plan ideal**, en una gráfica SVG hecha a mano (sin librerías).
- **Racha actual y mejor racha**, promedio diario y fecha estimada de término al ritmo que llevas.
- **Varios retos a la vez**, con su propio progreso.
- **Exportar e importar** tu progreso en un archivo `.json`.
- Tema claro y oscuro, pensado para celular.

## Privacidad

No hay cuentas ni servidor: **todo se guarda en tu navegador** (`localStorage`).
Para pasar tu progreso a otro dispositivo, exportas el respaldo y lo importas allá.

> La versión anterior de esta app guardaba usuarios y contraseñas en texto plano en una
> hoja de cálculo. Se rehízo desde cero justamente para quitar eso.

## Cómo está armado

```
src/lib/challenge.js   ← toda la lógica: montos, depósitos, rachas y estadísticas
src/lib/storage.js     ← guardar, exportar e importar
src/components/        ← interfaz (alta del reto, resumen, montos, historial, gráfica)
```

La lógica está separada de React a propósito: no toca el DOM ni el navegador, así que se
prueba sola. **18 pruebas** cubren los montos de cada modo, que la meta cuadre al peso, el
sorteo sin repetir, las rachas y la serie de la gráfica.

```bash
npm install
npm run dev     # desarrollo
npm test        # pruebas
npm run build   # producción
```

## Stack

React · Vite · Vitest · sin dependencias de UI
