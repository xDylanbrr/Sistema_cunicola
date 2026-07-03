// db.js — conexión única a SQLite y utilidades de cálculo cunícola
const path = require('path');
const os = require('os');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// La base NO se guarda dentro de la carpeta del proyecto por defecto:
// las carpetas sincronizadas (OneDrive/Google Drive) bloquean el archivo
// SQLite y provocan errores de I/O. Se usa una carpeta local del usuario.
// Puede sobrescribirse con la variable de entorno CONEJOS_DB.
let DB_PATH = process.env.CONEJOS_DB;
if (!DB_PATH) {
  const dir = process.env.VERCEL ? '/tmp' : path.join(os.homedir(), '.sistema-conejos');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  DB_PATH = path.join(dir, 'conejos.db');
}
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

// Auto-inicialización si la base está vacía (muy útil para Vercel o nuevos entornos)
try {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='animales'").get();
  if (!tableCheck) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS razas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS animales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jaula TEXT, arete TEXT,
        raza_id INTEGER REFERENCES razas(id),
        sexo TEXT CHECK (sexo IN ('M','H')),
        fecha_nacimiento TEXT, categoria TEXT, origen TEXT,
        id_padre TEXT, id_madre TEXT, temperamento TEXT,
        estado_sanitario TEXT, estado TEXT DEFAULT 'Activo',
        fecha_baja TEXT, motivo_destino TEXT, observaciones TEXT,
        creado_en TEXT DEFAULT (datetime('now')),
        actualizado_en TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS pesajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        animal_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL, peso_kg REAL, condicion_corporal INTEGER, notas TEXT,
        creado_en TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS montas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hembra_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
        macho_id INTEGER REFERENCES animales(id),
        fecha_monta TEXT NOT NULL, metodo TEXT DEFAULT 'Natural',
        palpacion_resultado TEXT DEFAULT 'Pendiente', estado TEXT DEFAULT 'Activa', notas TEXT,
        creado_en TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS partos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monta_id INTEGER REFERENCES montas(id) ON DELETE SET NULL,
        hembra_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
        fecha_parto TEXT NOT NULL, nacidos_vivos INTEGER DEFAULT 0, nacidos_muertos INTEGER DEFAULT 0,
        fecha_destete_real TEXT, gazapos_destetados INTEGER, peso_camada_kg REAL, notas TEXT,
        creado_en TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sanidad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        animal_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL, fecha TEXT NOT NULL, producto TEXT, dosis TEXT, via TEXT,
        proxima_fecha TEXT, notas TEXT, creado_en TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_pesajes_animal ON pesajes(animal_id, fecha);
      CREATE INDEX IF NOT EXISTS idx_montas_hembra ON montas(hembra_id);
      CREATE INDEX IF NOT EXISTS idx_partos_hembra ON partos(hembra_id);
      CREATE INDEX IF NOT EXISTS idx_sanidad_animal ON sanidad(animal_id);
    `);

    const RAZAS = ['Nueva Zelanda','California','Chinchilla','Mariposa','Gigante de Flandes','Pardo Cubano','Azul de Viena','Rex','Mestizo'];
    const insRaza = db.prepare('INSERT OR IGNORE INTO razas (nombre) VALUES (?)');
    RAZAS.forEach(r => insRaza.run(r));

    const seedPath = path.join(__dirname, 'seed-data.json');
    if (fs.existsSync(seedPath)) {
      const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      const razaId = db.prepare('SELECT id FROM razas WHERE nombre = ?');
      const normalizaRaza = (raza) => {
        if (!raza) return { base: 'Mestizo', color: null };
        const m = raza.match(/^([^(]+?)\s*(?:\(([^)]+)\))?$/);
        const base = (m ? m[1] : raza).trim();
        const color = m && m[2] ? m[2].trim() : null;
        return { base, color };
      };
      const normSan = s => !s ? 'Sano' : (/saneado/i.test(s) ? 'Sano' : s);
      const normTemp = t => !t ? 'Normal' : (/nervios/i.test(t) ? 'Nervioso' : /agres/i.test(t) ? 'Agresivo' : /docil|dócil/i.test(t) ? 'Dócil' : 'Normal');
      const insAnimal = db.prepare(`INSERT INTO animales (jaula, raza_id, sexo, categoria, origen, temperamento, estado_sanitario, estado, observaciones) VALUES (?,?,?,?,?,?,?,'Activo',?)`);
      const insPeso = db.prepare(`INSERT INTO pesajes (animal_id, fecha, peso_kg) VALUES (?, date('now'), ?)`);
      
      db.exec('BEGIN');
      for (const f of data) {
        const { base, color } = normalizaRaza(f.raza);
        let rid = razaId.get(base);
        if (!rid) { insRaza.run(base); rid = razaId.get(base); }
        const obs = [];
        if (color) obs.push('Color: ' + color);
        if (f.observaciones) obs.push(f.observaciones);
        const categoria = f.sexo === 'M' ? 'Reproductor' : 'Reproductora';
        const info = insAnimal.run(String(f.jaula), rid.id, f.sexo, categoria, 'Nacido en granja', normTemp(f.temperamento), normSan(f.estado_sanitario), obs.join(' | ') || null);
        if (f.peso_kg != null && f.peso_kg !== '') insPeso.run(info.lastInsertRowid, f.peso_kg);
      }
      db.exec('COMMIT');
    }
  }
} catch (err) {
  console.error('Error auto-initializing SQLite database:', err);
}

const PARAMS = {
  GESTACION_DIAS: 31,
  PALPACION_DIAS: 12,
  NIDO_DIAS: 28,
  DESTETE_DIAS: 35,
  KG_A_LB: 2.20462
};

function addDays(iso, n) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function edadMeses(fechaNac) {
  if (!fechaNac) return null;
  const d = new Date(fechaNac + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.round(((Date.now() - d.getTime()) / 86400000 / 30.44) * 10) / 10;
}
function edadDias(fechaNac) {
  if (!fechaNac) return null;
  const d = new Date(fechaNac + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function kgALb(kg) {
  if (kg == null || kg === '') return null;
  return Math.round(kg * PARAMS.KG_A_LB * 100) / 100;
}

module.exports = { db, DB_PATH, PARAMS, addDays, edadMeses, edadDias, kgALb };
