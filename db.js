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
  const dir = path.join(os.homedir(), '.sistema-conejos');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  DB_PATH = path.join(dir, 'conejos.db');
}
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

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
