# 🐇 Sistema de Gestión Cunícola

Plataforma web para captura eficiente de datos en granjas de conejos.
Reemplaza el registro en Excel por una aplicación optimizada para **celular/tablet
junto a las jaulas**, con base de datos, cálculos automáticos y listas desplegables.

Construida a partir de los campos del archivo
*"Campos de levantamiento informacion sistema conejos.xlsx"* y de las mejores
prácticas de manejo cunícola aceptadas globalmente.

---

## ¿Qué mejora frente al Excel?

**Se calculan automáticamente (ya no se escriben a mano):**

| Campo | Cómo se calcula |
|---|---|
| Peso en libras | del peso en kg (× 2.20462) |
| Edad en meses | de la fecha de nacimiento |
| Fecha de palpación | fecha de monta + 12 días |
| Fecha de colocar nidal | fecha de monta + 28 días |
| Parto probable | fecha de monta + 31 días (gestación) |
| Destete probable | fecha de parto + 35 días |
| Indicadores (prolificidad, mortalidad, etc.) | de los partos registrados |

**Se eligen de una lista desplegable (menos errores de escritura):**
raza, sexo, categoría, origen, condición corporal (1–5), temperamento,
estado sanitario, estado del animal, motivo de baja, método de monta,
resultado de palpación, tipo de evento sanitario y vía de administración.

**Datos normalizados del Excel original:** el sexo se unificó a Macho/Hembra
(antes mezclaba M/H/F); el temperamento se separó del sexo; los colores del
mestizo (ej. "negro/blanco") se movieron a observaciones; "Saneado (as)" pasó a
"Sano".

---

## Funciones principales

- **Tablero**: inventario (hembras/machos), indicadores productivos y
  **tareas del día** (palpaciones, nidales, partos y destetes próximos, refuerzos sanitarios).
- **Ficha de cada animal** con historial de pesajes, reproducción y sanidad.
- **Ciclo reproductivo guiado**: monta → palpación → parto → destete, con todas
  las fechas calculadas solas.
- **Sanidad**: vacunaciones, desparasitaciones y tratamientos con recordatorio de refuerzo.
- **Exportar a Excel/CSV** el registro completo en un clic.
- **Multiusuario**: varios celulares en la misma red WiFi usan la misma base de datos.

---

## Requisitos

- Una computadora (Windows, Mac o Linux) que quede encendida y haga de "servidor".
- **Node.js 22 o superior** — descárgalo gratis en https://nodejs.org (instalar la versión "LTS").

---

## Instalación (una sola vez)

Abre una terminal / símbolo del sistema **dentro de la carpeta `SistemaConejos`** y ejecuta:

```
npm install
npm run init
```

- `npm install` descarga lo necesario para funcionar.
- `npm run init` crea la base de datos y **carga los 47 animales** del Excel.

## Uso diario

```
npm start
```

Verás un mensaje como:

```
Sistema Cunícola corriendo en http://localhost:3000
Desde celulares en la misma red WiFi: http://<IP-de-esta-PC>:3000
```

- En **esta misma computadora**: abre el navegador en `http://localhost:3000`.
- Desde un **celular/tablet en la misma red WiFi**: abre `http://<IP>:3000`,
  reemplazando `<IP>` por la dirección IP local de la computadora servidor
  (en Windows: ejecuta `ipconfig` y usa la "Dirección IPv4", ej. `192.168.1.20`).

> Consejo: en el celular, usa el botón "Agregar a pantalla de inicio" del
> navegador para tener el sistema como si fuera una app.

Para **detener** el servidor: cierra la terminal o presiona `Ctrl + C`.

---

## ¿Dónde se guardan los datos?

En una carpeta local del usuario: **`C:\Users\<usuario>\.sistema-conejos\conejos.db`**
(fuera de OneDrive a propósito: las carpetas sincronizadas bloquean la base de
datos y causan errores).

**Respaldo:** copia periódicamente ese archivo `conejos.db` a un lugar seguro
(USB, otra carpeta). Es toda tu información en un solo archivo.

Para usar otra ubicación, define la variable de entorno `CONEJOS_DB` con la ruta deseada.

---

## Parámetros zootécnicos (ajustables)

Definidos en `db.js` (objeto `PARAMS`), según manejo cunícola estándar:

- Gestación: **31 días**
- Palpación de preñez: **día 12**
- Colocación del nidal: **día 28**
- Destete: **35 días** (rango comercial 28–35)

Si tu manejo usa otros valores, edítalos ahí y reinicia el servidor.

---

## Solución de problemas

- **"node no se reconoce"**: falta instalar Node.js (ver Requisitos).
- **El celular no abre la página**: deben estar en la **misma red WiFi**; verifica
  la IP con `ipconfig`; si persiste, permite Node.js en el Firewall de Windows.
- **Tarda en abrir la primera vez**: es normal mientras cargan los módulos; espera unos segundos.
