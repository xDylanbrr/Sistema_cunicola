// server.js — API REST del Sistema de Gestión Cunícola
const express = require('express');
const path = require('path');
const { db, PARAMS, addDays, edadMeses, edadDias, kgALb } = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_PORT = Number(process.env.PORT) || 3000;

function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`\n  Sistema Cunícola corriendo en http://localhost:${port}`);
    console.log(`  Desde celulares en la misma red WiFi: http://<IP-de-esta-PC>:${port}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`El puerto ${port} está ocupado. Probando ${nextPort}...`);
      startServer(nextPort);
      return;
    }
    throw err;
  });
}

// ---------- Catálogos (dropdowns) ----------
const CATALOGOS = {
  sexo: [{ v: 'M', t: 'Macho' }, { v: 'H', t: 'Hembra' }],
  categoria: ['Reproductor', 'Reproductora', 'Reposición', 'Engorde', 'Gazapo lactante'],
  origen: ['Nacido en granja', 'Comprado', 'Donado', 'Intercambio'],
  temperamento: ['Dócil', 'Normal', 'Nervioso', 'Agresivo'],
  estado_sanitario: ['Sano', 'En tratamiento', 'Enfermo', 'Cuarentena'],
  estado: ['Activo', 'Vendido', 'Sacrificado', 'Muerto', 'Descartado'],
  motivo_destino: ['Venta', 'Consumo', 'Baja reproductiva', 'Enfermedad', 'Muerte natural', 'Descarte por edad'],
  condicion_corporal: [
    { v: 1, t: '1 — Muy delgado' }, { v: 2, t: '2 — Delgado' },
    { v: 3, t: '3 — Óptimo' }, { v: 4, t: '4 — Sobrepeso' }, { v: 5, t: '5 — Obeso' }
  ],
  metodo_monta: ['Natural', 'Inseminación artificial'],
  palpacion_resultado: ['Pendiente', 'Positiva', 'Negativa', 'Dudosa'],
  sanidad_tipo: ['Vacunación', 'Desparasitación', 'Tratamiento', 'Revisión'],
  via_administracion: ['Oral', 'Subcutánea', 'Intramuscular', 'Tópica', 'Agua de bebida']
};

const ALMACEN = {
  resumen: {
    stock_total_kg: 280,
    items_activos: 4,
    ultimo_movimiento: '2026-07-02'
  },
  items: [
    { id: 1, nombre: 'Concentrado para conejos', stock_kg: 120, minimo_kg: 40, estado: 'OK' },
    { id: 2, nombre: 'Heno de alfalfa', stock_kg: 85, minimo_kg: 30, estado: 'OK' },
    { id: 3, nombre: 'Avena', stock_kg: 35, minimo_kg: 20, estado: 'Alerta' },
    { id: 4, nombre: 'Sal mineral', stock_kg: 40, minimo_kg: 15, estado: 'OK' }
  ]
};
function estadoStock(stock, minimo) {
  return stock <= minimo ? 'Alerta' : 'OK';
}
function actualizarResumen() {
  const total = ALMACEN.items.reduce((sum, item) => sum + Number(item.stock_kg || 0), 0);
  ALMACEN.resumen.stock_total_kg = total;
  ALMACEN.resumen.items_activos = ALMACEN.items.length;
  ALMACEN.resumen.ultimo_movimiento = new Date().toISOString().slice(0, 10);
}
function findAlmacenItem(id) {
  return ALMACEN.items.find(item => item.id === Number(id));
}

app.get('/api/catalogos', (req, res) => {
  const razas = db.prepare('SELECT id, nombre FROM razas ORDER BY nombre').all();
  res.json({ ...CATALOGOS, razas, params: PARAMS });
});

app.post('/api/razas', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  db.prepare('INSERT OR IGNORE INTO razas (nombre) VALUES (?)').run(nombre);
  res.json(db.prepare('SELECT id, nombre FROM razas WHERE nombre = ?').get(nombre));
});

app.get('/api/almacen', (req, res) => {
  actualizarResumen();
  res.json(ALMACEN);
});

app.post('/api/almacen/items', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  const stock_kg = Number(req.body.stock_kg);
  const minimo_kg = Number(req.body.minimo_kg);
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  if (Number.isNaN(stock_kg)) return res.status(400).json({ error: 'Stock inválido' });
  if (Number.isNaN(minimo_kg)) return res.status(400).json({ error: 'Mínimo inválido' });
  const item = {
    id: ALMACEN.items.length ? Math.max(...ALMACEN.items.map(i => i.id)) + 1 : 1,
    nombre,
    stock_kg,
    minimo_kg,
    estado: estadoStock(stock_kg, minimo_kg)
  };
  ALMACEN.items.push(item);
  actualizarResumen();
  res.json(item);
});

app.put('/api/almacen/items/:id', (req, res) => {
  const item = findAlmacenItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
  const nombre = (req.body.nombre || '').trim();
  const stock_kg = Number(req.body.stock_kg);
  const minimo_kg = Number(req.body.minimo_kg);
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  if (Number.isNaN(stock_kg)) return res.status(400).json({ error: 'Stock inválido' });
  if (Number.isNaN(minimo_kg)) return res.status(400).json({ error: 'Mínimo inválido' });
  item.nombre = nombre;
  item.stock_kg = stock_kg;
  item.minimo_kg = minimo_kg;
  item.estado = estadoStock(stock_kg, minimo_kg);
  actualizarResumen();
  res.json(item);
});

app.delete('/api/almacen/items/:id', (req, res) => {
  const index = ALMACEN.items.findIndex(item => item.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  ALMACEN.items.splice(index, 1);
  actualizarResumen();
  res.json({ ok: true });
});

// ---------- Helpers de enriquecimiento ----------
function pesoActual(animalId) {
  return db.prepare('SELECT peso_kg, condicion_corporal, fecha FROM pesajes WHERE animal_id=? ORDER BY fecha DESC, id DESC LIMIT 1').get(animalId);
}
function estadoReproductivo(animalId) {
  const m = db.prepare(`SELECT * FROM montas WHERE hembra_id=? AND estado='Activa' ORDER BY fecha_monta DESC LIMIT 1`).get(animalId);
  if (!m) return { estado: 'Vacía', monta: null };
  const enr = enriquecerMonta(m);
  const etiqueta = m.palpacion_resultado === 'Positiva' ? 'Preñada' :
    (m.palpacion_resultado === 'Negativa' ? 'Vacía' : 'Servida (sin palpar)');
  return { estado: etiqueta, monta: enr };
}
function enriquecerMonta(m) {
  return {
    ...m,
    palpacion_fecha: addDays(m.fecha_monta, PARAMS.PALPACION_DIAS),
    nido_fecha: addDays(m.fecha_monta, PARAMS.NIDO_DIAS),
    parto_probable: addDays(m.fecha_monta, PARAMS.GESTACION_DIAS)
  };
}
function enriquecerParto(p) {
  return { ...p, fecha_destete_probable: addDays(p.fecha_parto, PARAMS.DESTETE_DIAS) };
}
function enriquecerAnimal(a) {
  const p = pesoActual(a.id);
  const rep = a.sexo === 'H' ? estadoReproductivo(a.id) : null;
  return {
    ...a,
    edad_meses: edadMeses(a.fecha_nacimiento),
    edad_dias: edadDias(a.fecha_nacimiento),
    peso_kg: p ? p.peso_kg : null,
    peso_lb: p ? kgALb(p.peso_kg) : null,
    condicion_corporal: p ? p.condicion_corporal : null,
    fecha_pesaje: p ? p.fecha : null,
    estado_reproductivo: rep ? rep.estado : null,
    monta_activa: rep ? rep.monta : null
  };
}

const SQL_ANIMAL = `SELECT a.*, r.nombre AS raza FROM animales a LEFT JOIN razas r ON a.raza_id=r.id`;

// ---------- Animales ----------
app.get('/api/animales', (req, res) => {
  const { estado, sexo, q } = req.query;
  let sql = SQL_ANIMAL, where = [], params = [];
  if (estado) { where.push('a.estado=?'); params.push(estado); }
  if (sexo) { where.push('a.sexo=?'); params.push(sexo); }
  if (q) { where.push('(a.jaula LIKE ? OR a.arete LIKE ? OR a.observaciones LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY CAST(a.jaula AS INTEGER), a.jaula';
  const rows = db.prepare(sql).all(...params).map(enriquecerAnimal);
  res.json(rows);
});

app.get('/api/animales/:id', (req, res) => {
  const a = db.prepare(SQL_ANIMAL + ' WHERE a.id=?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'No encontrado' });
  const detalle = enriquecerAnimal(a);
  detalle.pesajes = db.prepare('SELECT * FROM pesajes WHERE animal_id=? ORDER BY fecha DESC, id DESC').all(a.id);
  detalle.montas = db.prepare('SELECT * FROM montas WHERE hembra_id=? ORDER BY fecha_monta DESC').all(a.id).map(enriquecerMonta);
  detalle.partos = db.prepare('SELECT * FROM partos WHERE hembra_id=? ORDER BY fecha_parto DESC').all(a.id).map(enriquecerParto);
  detalle.sanidad = db.prepare('SELECT * FROM sanidad WHERE animal_id=? ORDER BY fecha DESC').all(a.id);
  // machos: montas donde participó
  if (a.sexo === 'M') {
    detalle.montas = db.prepare('SELECT * FROM montas WHERE macho_id=? ORDER BY fecha_monta DESC').all(a.id).map(enriquecerMonta);
  }
  res.json(detalle);
});

const CAMPOS_ANIMAL = ['jaula', 'arete', 'raza_id', 'sexo', 'fecha_nacimiento', 'categoria',
  'origen', 'id_padre', 'id_madre', 'temperamento', 'estado_sanitario', 'estado',
  'fecha_baja', 'motivo_destino', 'observaciones'];

app.post('/api/animales', (req, res) => {
  const b = req.body;
  const cols = CAMPOS_ANIMAL.filter(c => b[c] !== undefined);
  const info = db.prepare(
    `INSERT INTO animales (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
  ).run(...cols.map(c => b[c] === '' ? null : b[c]));
  const id = info.lastInsertRowid;
  // peso inicial opcional
  if (b.peso_kg) {
    db.prepare(`INSERT INTO pesajes (animal_id, fecha, peso_kg, condicion_corporal) VALUES (?, date('now'), ?, ?)`)
      .run(id, b.peso_kg, b.condicion_corporal || null);
  }
  res.json(enriquecerAnimal(db.prepare(SQL_ANIMAL + ' WHERE a.id=?').get(id)));
});

app.put('/api/animales/:id', (req, res) => {
  const b = req.body;
  const cols = CAMPOS_ANIMAL.filter(c => b[c] !== undefined);
  if (cols.length) {
    db.prepare(`UPDATE animales SET ${cols.map(c => c + '=?').join(',')}, actualizado_en=datetime('now') WHERE id=?`)
      .run(...cols.map(c => b[c] === '' ? null : b[c]), req.params.id);
  }
  res.json(enriquecerAnimal(db.prepare(SQL_ANIMAL + ' WHERE a.id=?').get(req.params.id)));
});

app.delete('/api/animales/:id', (req, res) => {
  db.prepare('DELETE FROM animales WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Pesajes ----------
app.post('/api/animales/:id/pesajes', (req, res) => {
  const { fecha, peso_kg, condicion_corporal, notas } = req.body;
  db.prepare('INSERT INTO pesajes (animal_id, fecha, peso_kg, condicion_corporal, notas) VALUES (?,?,?,?,?)')
    .run(req.params.id, fecha || new Date().toISOString().slice(0, 10), peso_kg, condicion_corporal || null, notas || null);
  res.json({ ok: true, peso_lb: kgALb(peso_kg) });
});

// ---------- Montas ----------
app.post('/api/animales/:id/montas', (req, res) => {
  const { macho_id, fecha_monta, metodo, notas } = req.body;
  const info = db.prepare('INSERT INTO montas (hembra_id, macho_id, fecha_monta, metodo, notas) VALUES (?,?,?,?,?)')
    .run(req.params.id, macho_id || null, fecha_monta, metodo || 'Natural', notas || null);
  res.json(enriquecerMonta(db.prepare('SELECT * FROM montas WHERE id=?').get(info.lastInsertRowid)));
});

app.put('/api/montas/:id', (req, res) => {
  const { palpacion_resultado, estado, notas } = req.body;
  const cur = db.prepare('SELECT * FROM montas WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'No encontrada' });
  db.prepare('UPDATE montas SET palpacion_resultado=?, estado=?, notas=? WHERE id=?')
    .run(palpacion_resultado ?? cur.palpacion_resultado, estado ?? cur.estado, notas ?? cur.notas, req.params.id);
  res.json(enriquecerMonta(db.prepare('SELECT * FROM montas WHERE id=?').get(req.params.id)));
});

// ---------- Partos ----------
app.post('/api/montas/:id/parto', (req, res) => {
  const m = db.prepare('SELECT * FROM montas WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Monta no encontrada' });
  const { fecha_parto, nacidos_vivos, nacidos_muertos, peso_camada_kg, notas } = req.body;
  const info = db.prepare(`INSERT INTO partos (monta_id, hembra_id, fecha_parto, nacidos_vivos, nacidos_muertos, peso_camada_kg, notas)
    VALUES (?,?,?,?,?,?,?)`).run(m.id, m.hembra_id, fecha_parto, nacidos_vivos || 0, nacidos_muertos || 0, peso_camada_kg || null, notas || null);
  db.prepare(`UPDATE montas SET estado='Parida' WHERE id=?`).run(m.id);
  res.json(enriquecerParto(db.prepare('SELECT * FROM partos WHERE id=?').get(info.lastInsertRowid)));
});

app.put('/api/partos/:id', (req, res) => {
  const { fecha_destete_real, gazapos_destetados, notas } = req.body;
  const cur = db.prepare('SELECT * FROM partos WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'No encontrado' });
  db.prepare('UPDATE partos SET fecha_destete_real=?, gazapos_destetados=?, notas=? WHERE id=?')
    .run(fecha_destete_real ?? cur.fecha_destete_real, gazapos_destetados ?? cur.gazapos_destetados, notas ?? cur.notas, req.params.id);
  res.json(enriquecerParto(db.prepare('SELECT * FROM partos WHERE id=?').get(req.params.id)));
});

// ---------- Sanidad ----------
app.post('/api/animales/:id/sanidad', (req, res) => {
  const { tipo, fecha, producto, dosis, via, proxima_fecha, notas } = req.body;
  db.prepare(`INSERT INTO sanidad (animal_id, tipo, fecha, producto, dosis, via, proxima_fecha, notas)
    VALUES (?,?,?,?,?,?,?,?)`).run(req.params.id, tipo, fecha, producto || null, dosis || null, via || null, proxima_fecha || null, notas || null);
  res.json({ ok: true });
});

// ---------- Tablero / KPIs / Alertas ----------
app.get('/api/dashboard', (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const total = db.prepare(`SELECT COUNT(*) c FROM animales WHERE estado='Activo'`).get().c;
  const hembras = db.prepare(`SELECT COUNT(*) c FROM animales WHERE estado='Activo' AND sexo='H'`).get().c;
  const machos = db.prepare(`SELECT COUNT(*) c FROM animales WHERE estado='Activo' AND sexo='M'`).get().c;

  const montasActivas = db.prepare(`SELECT m.*, a.jaula FROM montas m JOIN animales a ON m.hembra_id=a.id WHERE m.estado='Activa'`).all();
  const alertas = { palpaciones: [], nidos: [], partos: [], destetes: [], sanidad: [] };
  for (const m of montasActivas) {
    const em = enriquecerMonta(m);
    if (m.palpacion_resultado === 'Pendiente' && em.palpacion_fecha <= hoy)
      alertas.palpaciones.push({ jaula: m.jaula, hembra_id: m.hembra_id, monta_id: m.id, fecha: em.palpacion_fecha });
    if (m.palpacion_resultado !== 'Negativa' && em.nido_fecha <= addDays(hoy, 3) && em.nido_fecha >= addDays(hoy, -2))
      alertas.nidos.push({ jaula: m.jaula, hembra_id: m.hembra_id, fecha: em.nido_fecha });
    if (m.palpacion_resultado !== 'Negativa' && em.parto_probable <= addDays(hoy, 4) && em.parto_probable >= addDays(hoy, -3))
      alertas.partos.push({ jaula: m.jaula, hembra_id: m.hembra_id, monta_id: m.id, fecha: em.parto_probable });
  }
  const partosSinDestetar = db.prepare(`SELECT p.*, a.jaula FROM partos p JOIN animales a ON p.hembra_id=a.id WHERE p.fecha_destete_real IS NULL`).all();
  for (const p of partosSinDestetar) {
    const ep = enriquecerParto(p);
    if (ep.fecha_destete_probable <= addDays(hoy, 3))
      alertas.destetes.push({ jaula: p.jaula, hembra_id: p.hembra_id, parto_id: p.id, fecha: ep.fecha_destete_probable });
  }
  const sanidadProx = db.prepare(`SELECT s.*, a.jaula FROM sanidad s JOIN animales a ON s.animal_id=a.id
    WHERE s.proxima_fecha IS NOT NULL AND s.proxima_fecha <= ? ORDER BY s.proxima_fecha`).all(addDays(hoy, 7));
  alertas.sanidad = sanidadProx.map(s => ({ jaula: s.jaula, animal_id: s.animal_id, tipo: s.tipo, fecha: s.proxima_fecha }));

  // KPIs productivos
  const kp = db.prepare(`SELECT COUNT(*) partos, COALESCE(SUM(nacidos_vivos),0) vivos,
    COALESCE(SUM(nacidos_muertos),0) muertos, COALESCE(SUM(gazapos_destetados),0) destetados
    FROM partos`).get();
  const prolificidad = kp.partos ? Math.round((kp.vivos / kp.partos) * 10) / 10 : 0;
  const nacidosTot = kp.vivos + kp.muertos;
  const mortalidadNac = nacidosTot ? Math.round((kp.muertos / nacidosTot) * 1000) / 10 : 0;
  const mortalidadPredestete = kp.vivos ? Math.round(((kp.vivos - kp.destetados) / kp.vivos) * 1000) / 10 : 0;

  res.json({
    inventario: { total, hembras, machos },
    kpis: { partos: kp.partos, prolificidad, mortalidad_nacimiento_pct: mortalidadNac, mortalidad_predestete_pct: mortalidadPredestete, gazapos_destetados: kp.destetados },
    alertas
  });
});

// ---------- Exportación CSV (registro plano tipo Excel) ----------
app.get('/api/export/csv', (req, res) => {
  const animales = db.prepare(SQL_ANIMAL + ' ORDER BY CAST(a.jaula AS INTEGER)').all().map(enriquecerAnimal);
  const cols = ['jaula', 'arete', 'raza', 'sexo', 'fecha_nacimiento', 'edad_meses', 'categoria', 'origen',
    'id_padre', 'id_madre', 'peso_kg', 'peso_lb', 'condicion_corporal', 'temperamento',
    'estado_reproductivo', 'estado_sanitario', 'estado', 'fecha_baja', 'motivo_destino', 'observaciones'];
  const esc = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const lines = [cols.join(',')];
  for (const a of animales) lines.push(cols.map(c => esc(a[c])).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="registro_cunicola.csv"');
  res.send('﻿' + lines.join('\n'));
});

startServer(DEFAULT_PORT);

module.exports = app;

